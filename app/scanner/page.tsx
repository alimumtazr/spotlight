"use client";
import { useState, useEffect, useRef, Fragment } from "react";
import { useAccount } from "wagmi";
import { verifyMessage } from "viem";
import { Html5Qrcode } from "html5-qrcode";
import jsQR from "jsqr";
import {
  createEventDb,
  DbEvent,
  getEvent,
  getTicket,
  incrementEventCounters,
  listOwnedEvents,
  markTicketScannedDb,
  ensureTicketExists,
} from "../../src/utils/dbEvents";
import { useToast } from "../../components/Toast";
import ModeSwitcher from "../../components/ModeSwitcher";

const QR_ROTATION_SECONDS = 30;

export default function ScannerPage() {
  const { address } = useAccount();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "IDLE" | "SUCCESS" | "ERROR" | "EXPIRED" | "ALREADY_SCANNED" | "SCANNING"
  >("IDLE");
  const [scannedUser, setScannedUser] = useState("");
  const [scannedCount, setScannedCount] = useState(0);
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "paste">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [lastScannedRaw, setLastScannedRaw] = useState(""); // For debugging
  const [errorDetail, setErrorDetail] = useState("");
  const [ownedEvents, setOwnedEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventExpiry, setNewEventExpiry] = useState("");
  const { showToast, ToastComponent } = useToast();
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load scanned tickets count on mount
  useEffect(() => {
    // no-op: scannedCount will be derived from owned events if needed
  }, []);

  // Load owned events
  useEffect(() => {
    if (!address) return;
    const load = async () => {
      const events = await listOwnedEvents(address);
      setOwnedEvents(events.filter((e) => e.expiresAt > Date.now()));
      setSelectedEventId(
        (prev) => prev || events.find((e) => e.expiresAt > Date.now())?.id || null
      );
      const totalScanned = events.reduce((acc, e) => acc + (e.scanned || 0), 0);
      setScannedCount(totalScanned);
    };
    load();
  }, [address]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const getCurrentWindow = () => Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));

  // Core verification logic
  const verifyTicketData = async (qrText: string) => {
    console.log("Raw QR text:", qrText);
    setLastScannedRaw(qrText);
    setErrorDetail("");
    if (!selectedEventId) {
      setErrorDetail("No event selected");
      setStatus("ERROR");
      return;
    }
    
    try {
      const data = JSON.parse(qrText);
      console.log("Parsed QR data:", data);
      
      const { address, tokenId, signature, window: qrWindow, eventId } = data;

      if (!address || !signature) {
        console.error("Missing address or signature in QR data");
        setErrorDetail("Missing address or signature in QR data");
        setStatus("ERROR");
        return;
      }

      // Require event selection and match
      if (!selectedEventId || eventId !== selectedEventId) {
        setErrorDetail("QR is for a different event");
        setStatus("ERROR");
        return;
      }

      // Load event & ticket from DB
      const [evt, ticket] = await Promise.all([getEvent(eventId), getTicket(tokenId)]);
      if (!evt) {
        setErrorDetail("Event not found");
        setStatus("ERROR");
        return;
      }
      if (evt.expiresAt <= Date.now()) {
        setErrorDetail("Event expired");
        setStatus("ERROR");
        return;
      }
      let ticketRef = ticket;
      if (!ticketRef) {
      } else if (ticketRef.scanned) {
        setStatus("ALREADY_SCANNED");
        setScannedUser(address);
        return;
      }

      const currentWindow = getCurrentWindow();
      const windowDiff = Math.abs(currentWindow - qrWindow);
      console.log("Window check:", { qrWindow, currentWindow, windowDiff });

      if (windowDiff > 1) {
        setStatus("EXPIRED");
        return;
      }

      // Verify signature
      const expectedMessage = `SPOTLIGHT_TICKET:${address}:${tokenId}:${eventId}:GIKI_EVENT`;
      console.log("Verifying message:", expectedMessage);
      
      try {
        const isValid = await verifyMessage({
          address: address as `0x${string}`,
          message: expectedMessage,
          signature: signature as `0x${string}`,
        });

        console.log("Signature valid:", isValid);

        if (isValid) {
          // If ticket missing, create it on the fly (signature proves ownership)
          if (!ticketRef) {
            ticketRef = await ensureTicketExists(tokenId, eventId, address);
          }
          await markTicketScannedDb(tokenId);
          await incrementEventCounters(eventId, { scanned: 1 });
          setStatus("SUCCESS");
          setScannedUser(address);
          setOwnedEvents(await listOwnedEvents(address || ""));
          showToast("✓ Access granted! Ticket verified", "success");
        } else {
          setErrorDetail("Signature verification returned false");
          setStatus("ERROR");
          showToast("Invalid signature", "error");
        }
      } catch (sigError) {
        console.error("Signature verification error:", sigError);
        setErrorDetail(`Signature error: ${sigError instanceof Error ? sigError.message : String(sigError)}`);
        setStatus("ERROR");
      }
    } catch (e) {
      console.error("Verification error:", e);
      setErrorDetail(`Parse error: ${e instanceof Error ? e.message : "Invalid JSON"}`);
      setStatus("ERROR");
    }
  };

  // Start camera scanning
  const startCamera = async () => {
    try {
      setStatus("SCANNING");
      setCameraActive(true);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop camera after successful scan
          await stopCamera();
          setInput(decodedText);
          await verifyTicketData(decodedText);
        },
        () => {} // Ignore scan errors
      );
    } catch (err) {
      console.error("Camera error:", err);
      setCameraActive(false);
      setStatus("IDLE");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setCameraActive(false);
  };

  // Decode QR from image using jsQR (more reliable for static images)
  const decodeQRFromImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try to decode QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          resolve(code.data);
        } else {
          // Try with inverted colors
          const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (codeInverted) {
            resolve(codeInverted.data);
          } else {
            reject(new Error("No QR code found in image"));
          }
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("SCANNING");
    setErrorDetail("");
    setLastScannedRaw("");
    
    try {
      console.log("Scanning image:", file.name, file.type, file.size);
      
      // Use jsQR for static image scanning (more reliable)
      const decodedText = await decodeQRFromImage(file);
      console.log("Decoded from image:", decodedText);
      
      setInput(decodedText);
      await verifyTicketData(decodedText);
    } catch (err) {
      console.error("Image scan error:", err);
      
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorDetail(`${errorMsg}\n\nTips:\n• Crop image to just the QR code\n• Ensure QR is clear and not blurry\n• Try a screenshot instead of photo`);
      setLastScannedRaw("Could not decode QR from image");
      setStatus("ERROR");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateEvent = async () => {
    if (!address) {
      showToast("Please connect your wallet first", "error");
      return;
    }
    if (!newEventName || !newEventExpiry) {
      showToast("Please fill in all fields", "error");
      return;
    }
    const expiresAt = new Date(newEventExpiry).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      setErrorDetail("Expiry must be in the future");
      setStatus("ERROR");
      showToast("Expiry must be in the future", "error");
      return;
    }
    
    try {
      const eventName = newEventName; // Save before clearing
      const evt = await createEventDb(eventName, expiresAt, address);
      console.log("Event created:", evt);
      
      // Refresh events list
      const updatedEvents = await listOwnedEvents(address);
      setOwnedEvents(updatedEvents);
      setSelectedEventId(evt.id);
      
      // Clear form
      setNewEventName("");
      setNewEventExpiry("");
      setStatus("IDLE");
      
      showToast(`Event "${eventName}" created!`, "success");
    } catch (error) {
      console.error("Failed to create event:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to create event";
      setErrorDetail(errorMsg);
      setStatus("ERROR");
      showToast(`Error: ${errorMsg}`, "error");
    }
  };

  // Handle paste verification
  const verifyPasted = async () => {
    if (!input.trim()) return;
    await verifyTicketData(input);
  };

  return (
    <Fragment>
      {ToastComponent}
      <ModeSwitcher />
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              SpotLight Guard Terminal
            </h1>
            <p className="text-gray-400">Secure event access control</p>
          </div>
          
          {/* Stats Card */}
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Scanned</p>
                <p className="text-3xl font-bold text-blue-400">{scannedCount}</p>
              </div>
              <div className="text-4xl">🎫</div>
            </div>
          </div>

          {/* Event Creation */}
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 pb-4 border-b border-gray-800">Create Event</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Event name"
                  className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="datetime-local"
                  value={newEventExpiry}
                  onChange={(e) => setNewEventExpiry(e.target.value)}
                  className="bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCreateEvent}
                type="button"
                disabled={!address || !newEventName || !newEventExpiry}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-500 active:scale-95 disabled:active:scale-100"
              >
                Create Event
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Buyers must open the event link to purchase a ticket. Expired events are hidden automatically.
              </p>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 pb-4 border-b border-gray-800">Your Events</h3>
            {ownedEvents.filter((e) => e.expiresAt > Date.now()).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No active events yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first event above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ownedEvents
                  .filter((e) => e.expiresAt > Date.now())
                  .map((e) => {
                    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?eventId=${e.id}`;
                    return (
                      <div
                        key={e.id}
                        className={`p-5 rounded-xl border-2 transition-colors ${
                          selectedEventId === e.id
                            ? "bg-blue-500/10 border-blue-500"
                            : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-lg mb-2">{e.name}</h4>
                            <p className="text-xs text-gray-400 mb-3">
                              Expires {new Date(e.expiresAt).toLocaleString()}
                            </p>
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-500">Sold: <span className="text-blue-400 font-bold">{e.sold}</span></span>
                              <span className="text-gray-500">Scanned: <span className="text-green-400 font-bold">{e.scanned}</span></span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedEventId(e.id);
                              showToast(`Switched to "${e.name}"`, "info");
                            }}
                            type="button"
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
                              selectedEventId === e.id
                                ? "bg-blue-600 text-white border-blue-500 shadow-lg"
                                : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                            }`}
                          >
                            {selectedEventId === e.id ? "Active" : "Select"}
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(link);
                            showToast("Ticket link copied!", "success");
                          }}
                          type="button"
                          className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-gray-600 active:scale-95"
                        >
                          Copy Ticket Link
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Scanner Section */}
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 pb-4 border-b border-gray-800">Ticket Scanner</h3>
            
            {selectedEventId ? (
              <div className="mb-4 px-4 py-2.5 bg-blue-500/10 border-2 border-blue-500 rounded-lg inline-block">
                <span className="text-sm text-gray-300">Scanning: </span>
                <span className="text-blue-400 font-bold">
                  {ownedEvents.find((e) => e.id === selectedEventId)?.name || selectedEventId}
                </span>
              </div>
            ) : (
              <div className="mb-4 px-4 py-2.5 bg-yellow-500/10 border-2 border-yellow-500 rounded-lg inline-block">
                <span className="text-yellow-400 text-sm font-semibold">⚠️ Select or create an event to start scanning</span>
              </div>
            )}

            {/* Scan Mode Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-800 rounded-lg p-1.5 border-2 border-gray-700">
              {[
                { id: "camera", label: "Camera" },
                { id: "upload", label: "Image" },
                { id: "paste", label: "Paste" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={async () => {
                    if (cameraActive) await stopCamera();
                    setScanMode(mode.id as typeof scanMode);
                    setStatus("IDLE");
                  }}
                  type="button"
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
                    scanMode === mode.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700 border-transparent"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Scanner Area */}
            <div className="space-y-4">
              {/* Camera Mode */}
              {scanMode === "camera" && (
                <div className="space-y-4">
                  <div 
                    id="qr-reader" 
                    className="w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
                    style={{ minHeight: cameraActive ? "300px" : "0" }}
                  />
                  
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      type="button"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-500 active:scale-95"
                    >
                      Start Camera Scan
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      type="button"
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-500 active:scale-95"
                    >
                      Stop Camera
                    </button>
                  )}
                  
                  <p className="text-sm text-gray-500 text-center">
                    Point camera at the QR code on user&apos;s phone
                  </p>
                </div>
              )}

              {/* Upload Mode */}
              {scanMode === "upload" && (
                <div className="space-y-4">
                  <div id="qr-reader-hidden" style={{ display: "none" }} />
                  
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-800/50">
                      <span className="text-4xl mb-3 block">🖼️</span>
                      <span className="text-gray-300 block mb-1 font-medium">Click to upload QR image</span>
                      <span className="text-xs text-gray-500">PNG, JPG, or screenshot</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Paste Mode */}
              {scanMode === "paste" && (
                <div className="space-y-4">
                  <label className="text-sm text-gray-400 block">Paste QR Data</label>
                  <textarea
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={5}
                    placeholder='{"address": "0x...", "tokenId": "0", "signature": "0x...", "window": 12345}'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button
                    onClick={verifyPasted}
                    type="button"
                    className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-gray-300 active:scale-95"
                  >
                    Verify Ticket
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status Display */}
          <div className="space-y-4">
            {status === "SCANNING" && (
              <div className="bg-blue-500/20 border border-blue-500 p-6 rounded-lg text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-blue-400">Scanning...</h2>
              </div>
            )}

            {status === "SUCCESS" && (
              <div className="bg-green-500/10 border-2 border-green-500 p-6 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-green-400 mb-2">✓ Access Granted</h2>
                <p className="text-white font-mono text-sm mb-1">
                  User: {scannedUser.slice(0, 6)}...{scannedUser.slice(-4)}
                </p>
                <p className="text-green-200 text-xs mb-4">Signature Verified • Ticket Marked Used</p>
                <button
                  onClick={() => setStatus("IDLE")}
                  type="button"
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-green-500 active:scale-95"
                >
                  Scan Next
                </button>
              </div>
            )}

            {status === "ALREADY_SCANNED" && (
              <div className="bg-orange-500/10 border-2 border-orange-500 p-6 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-orange-500 mb-2">⚠️ Already Used</h2>
                <p className="text-orange-300 mb-1">This ticket was already scanned!</p>
                <p className="text-white font-mono text-sm mb-1">
                  User: {scannedUser.slice(0, 6)}...{scannedUser.slice(-4)}
                </p>
                <p className="text-orange-400 text-xs mb-4">Do not allow entry - possible duplicate</p>
                <button
                  onClick={() => setStatus("IDLE")}
                  type="button"
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-orange-500 active:scale-95"
                >
                  Scan Next
                </button>
              </div>
            )}

            {status === "EXPIRED" && (
              <div className="bg-yellow-500/10 border-2 border-yellow-500 p-6 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-yellow-500 mb-2">📸 Screenshot?</h2>
                <p className="text-yellow-300 mb-1">QR code is stale (older than 30s)</p>
                <p className="text-yellow-400 text-xs mb-4">Ask user to show their live app - QR auto-refreshes</p>
                <button
                  onClick={() => setStatus("IDLE")}
                  type="button"
                  className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-black font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-yellow-500 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "ERROR" && (
              <div className="bg-red-500/10 border-2 border-red-500 p-6 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">✗ Invalid</h2>
                <p className="text-red-300 mb-2">Fake Ticket or Bad Signature</p>
                {errorDetail && (
                  <p className="text-red-400 text-xs mb-2 font-mono">{errorDetail}</p>
                )}
                {lastScannedRaw && (
                  <details className="mt-3 text-left mb-4">
                    <summary className="text-xs text-gray-500 cursor-pointer">Show scanned data</summary>
                    <pre className="mt-2 p-2 bg-black/50 rounded text-[10px] text-gray-400 overflow-auto max-h-32">
                      {lastScannedRaw}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => setStatus("IDLE")}
                  type="button"
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-500 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "IDLE" && (
              <p className="text-gray-500 text-center text-sm">
                {scanMode === "camera" ? "Start camera to scan QR codes" : 
                 scanMode === "upload" ? "Upload an image with a QR code" :
                 "Paste QR data and verify"}
              </p>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
