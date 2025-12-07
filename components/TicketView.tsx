"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useSignMessage,
} from "wagmi";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { SPOTLIGHT_ABI } from "../abi";
import {
  createTicket,
  DbEvent,
  DbTicket,
  listActiveEvents,
  listTicketsForAddress,
} from "../src/utils/dbEvents";
import { useToast } from "./Toast";

const CONTRACT_ADDRESS = "0x0DC21BC674aF456411D98d01E79Ed98e7eaDFbe6";
const QR_ROTATION_SECONDS = 30;

// Get current 30-second time window
const getCurrentWindow = () => Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));

export default function TicketView() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContract } = useWriteContract();
  const searchParams = useSearchParams();

  const [timeLeft, setTimeLeft] = useState(QR_ROTATION_SECONDS);
  const [currentWindow, setCurrentWindow] = useState(getCurrentWindow());
  const [status, setStatus] = useState<"idle" | "signing" | "ready" | "error">("idle");
  
  // Signatures keyed by event
  const [signatures, setSignatures] = useState<Record<
    string,
    { address: string; tokenId: string; signature: string }
  >>({});

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Contract balance check removed - not needed for current implementation
  // const { data: balance } = useReadContract({
  //   address: CONTRACT_ADDRESS,
  //   abi: SPOTLIGHT_ABI,
  //   functionName: "balanceOf",
  //   args: [address as `0x${string}`],
  //   query: { enabled: !!address },
  // });

  // Load events/tickets from local storage (client only)
  useEffect(() => {
    if (!address) return;
    const load = async () => {
      const [active, myTickets] = await Promise.all([
        listActiveEvents(),
        listTicketsForAddress(address),
      ]);
      setEvents(active);
      setTickets(myTickets);

      const urlEvent = searchParams?.get("eventId");
      const chosen =
        urlEvent && active.find((e) => e.id === urlEvent)
          ? urlEvent
          : myTickets.find((t) => active.some((e) => e.id === t.eventId))?.eventId ||
            active[0]?.id ||
            null;
      setSelectedEventId(chosen);
    };
    load();
    
    // Refresh tickets every 5 seconds to check if they've been scanned
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [address, searchParams]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const currentSignature = selectedEventId ? signatures[selectedEventId] : null;
  const hasTicketForSelected = useMemo(
    () =>
      selectedEventId &&
      tickets.some((t) => t.eventId === selectedEventId && t.address === (address || "").toLowerCase()),
    [tickets, selectedEventId, address]
  );

  // Get current ticket to check if it's been scanned
  const currentTicket = useMemo(
    () =>
      selectedEventId && address
        ? tickets.find((t) => t.eventId === selectedEventId && t.address === address.toLowerCase())
        : null,
    [tickets, selectedEventId, address]
  );

  const isTicketScanned = currentTicket?.scanned || false;

  // Generate QR string from signature + current window
  const getQRData = useCallback(() => {
    if (!currentSignature || !selectedEventId || isTicketScanned) return "";
    return JSON.stringify({
      ...currentSignature,
      eventId: selectedEventId,
      window: currentWindow,
    });
  }, [currentSignature, selectedEventId, isTicketScanned, currentWindow]);

  // Sign ONCE per event when ticket exists
  useEffect(() => {
    if (
      !hasTicketForSelected ||
      !address ||
      !selectedEventId ||
      currentSignature ||
      status === "signing" ||
      !currentTicket
    )
      return;

    const doSign = async () => {
      setStatus("signing");
      
      try {
        // Use the ticket's actual tokenId, not hardcoded "0"
        const tokenId = currentTicket.tokenId;
        const message = `SPOTLIGHT_TICKET:${address}:${tokenId}:${selectedEventId}:GIKI_EVENT`;
        
        const signature = await signMessageAsync({ message });

        setSignatures((prev) => ({
          ...prev,
          [selectedEventId]: {
            address,
            tokenId,
            signature,
          },
        }));
        setStatus("ready");
      } catch (e) {
        console.error("Signature failed:", e);
        setStatus("error");
      }
    };

    doSign();
  }, [hasTicketForSelected, address, selectedEventId, currentSignature, status, signMessageAsync, currentTicket]);

  // Timer for QR rotation countdown and window updates
  useEffect(() => {
    if (status !== "ready" || !hasTicketForSelected || isTicketScanned) return;

    // Update window every 30 seconds to trigger QR refresh
    const windowInterval = setInterval(() => {
      const newWindow = getCurrentWindow();
      setCurrentWindow(newWindow);
      setTimeLeft(QR_ROTATION_SECONDS); // Reset countdown
    }, QR_ROTATION_SECONDS * 1000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return QR_ROTATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(windowInterval);
      clearInterval(countdownInterval);
    };
  }, [status, hasTicketForSelected, isTicketScanned]);

  const handleCopy = useCallback(() => {
    const data = getQRData();
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    showToast("QR details copied!", "success");
    setTimeout(() => setCopied(false), 1200);
  }, [getQRData, showToast]);

  const handleMint = async () => {
    if (!selectedEventId) return;
    // On-chain mint (optional; kept from previous flow)
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: SPOTLIGHT_ABI,
      functionName: "mintTicket",
      args: [],
    });
    // Persist ticket in Firestore
    await createTicket(selectedEventId, address as string);
    setTickets(await listTicketsForAddress(address as string));
    setStatus("idle");
  };

  if (!address)
    return <div className="p-4 text-center">Please Connect Wallet</div>;

  if (!selectedEventId) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Available Events</h2>
          <p className="text-gray-400">
            Select an event to view your ticket or get a new one
          </p>
        </div>
        {events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => {
              const hasTicket = tickets.some((t) => t.eventId === e.id && t.address === (address || "").toLowerCase());
              const ticket = tickets.find((t) => t.eventId === e.id && t.address === (address || "").toLowerCase());
              const isExpired = e.expiresAt <= Date.now();
              const isScanned = ticket?.scanned || false;
              
              return (
                <div
                  key={e.id}
                  className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 hover:border-blue-500 transition-all duration-200 shadow-xl hover:shadow-2xl cursor-pointer"
                  onClick={() => setSelectedEventId(e.id)}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex-1 pr-2">
                      {e.name}
                    </h3>
                    {hasTicket && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        isScanned 
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}>
                        {isScanned ? "USED" : "TICKET"}
                      </span>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span>📅</span>
                        <span>{new Date(e.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                        <span className="text-blue-400 font-bold text-sm">
                          {e.price && e.price > 0 ? `${e.price} USDC` : "FREE"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>🕐</span>
                      <span>{new Date(e.expiresAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>👥</span>
                      <span>{e.sold} sold • {e.scanned} scanned</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        isExpired
                          ? "bg-gray-700 text-gray-400"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {isExpired ? "EXPIRED" : "STATUS: OPEN"}
                      </span>
                      {!isExpired && (
                        <span className="text-yellow-400 text-xs font-medium">
                          Deadline: {new Date(e.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      setSelectedEventId(e.id);
                    }}
                    type="button"
                    className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-500 active:scale-95"
                  >
                    {hasTicket ? (isScanned ? "View Details" : "View Ticket") : "Get Ticket"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-bold mb-2">No Active Events</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Ask the organizer for an event link, or check back later for new events.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Get fresh QR data on every render (window updates automatically)
  const qrData = getQRData();

  return (
    <>
      {ToastComponent}
      <div className="w-full max-w-2xl mx-auto">
        {/* Main Ticket Card */}
        <div className="bg-gray-900 rounded-xl p-8 border-2 border-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-800">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {selectedEvent?.name || "VIP Access"}
              </h2>
              {selectedEvent && (
                <p className="text-gray-400 text-sm">
                  Expires {new Date(selectedEvent.expiresAt).toLocaleDateString()} at {new Date(selectedEvent.expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border-2 ${
              isTicketScanned
                ? "bg-orange-500/10 border-orange-500 text-orange-400"
                : status === "ready"
                ? "bg-green-500/10 border-green-500 text-green-400"
                : status === "error"
                ? "bg-red-500/10 border-red-500 text-red-400"
                : "bg-yellow-500/10 border-yellow-500 text-yellow-400"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                isTicketScanned ? "bg-orange-400" :
                status === "ready" ? "bg-green-400" : 
                status === "error" ? "bg-red-400" : "bg-yellow-400"
              }`} />
              <span className="font-semibold text-sm">
                {isTicketScanned ? "USED" : status === "ready" ? "LIVE" : status === "error" ? "ERROR" : "SIGNING"}
              </span>
            </div>
          </div>

          {/* Event Tabs */}
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setStatus("idle");
                  }}
                  type="button"
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                    selectedEventId === e.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg"
                      : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          )}

          {/* Event Stats */}
          {selectedEvent && (
            <div className="flex gap-4 mb-6 text-sm">
              <div className="px-4 py-2 bg-gray-800 rounded-lg border-2 border-gray-700">
                <span className="text-gray-400">Sold: </span>
                <span className="text-blue-400 font-bold">{selectedEvent.sold}</span>
              </div>
              <div className="px-4 py-2 bg-gray-800 rounded-lg border-2 border-gray-700">
                <span className="text-gray-400">Scanned: </span>
                <span className="text-green-400 font-bold">{selectedEvent.scanned}</span>
              </div>
            </div>
          )}

          {/* QR Code Container */}
          <div className="mb-6">
            <div className="bg-white p-8 rounded-xl border-2 border-gray-300 shadow-lg">
              <div className="flex flex-col items-center">
                {hasTicketForSelected ? (
                  isTicketScanned ? (
                    <div className="w-[240px] h-[240px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <p className="text-orange-600 font-bold text-lg mb-2">Ticket Already Used</p>
                        <p className="text-gray-600 text-sm">This ticket was scanned and cannot be used again.</p>
                      </div>
                    </div>
                  ) : qrData ? (
                    <>
                      <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                        <QRCode value={qrData} size={240} key={`${currentWindow}-${selectedEventId}`} />
                      </div>
                      <button
                        onClick={handleCopy}
                        type="button"
                        className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-500 active:scale-95"
                      >
                        {copied ? "✓ Copied!" : "Copy QR Details"}
                      </button>
                      <details className="mt-4 w-full">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                          Show QR Data
                        </summary>
                        <pre className="text-[10px] text-gray-600 bg-gray-50 rounded p-2 overflow-auto max-h-32 border border-gray-200">
                          {qrData}
                        </pre>
                      </details>
                    </>
                  ) : (
                    <div className="w-[220px] h-[220px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500 text-sm">
                          {status === "signing"
                            ? "Signing ticket..."
                            : status === "error"
                            ? "Signature failed"
                            : "Preparing..."}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-3">🎫</div>
                      <p className="text-gray-500 font-medium">No ticket yet</p>
                      <p className="text-gray-400 text-sm mt-1">Get your ticket below</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mint Button */}
          {!hasTicketForSelected && (
            <button
              onClick={handleMint}
              type="button"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-blue-500 active:scale-95"
            >
              Get Ticket for this Event
            </button>
          )}

          {/* Auto-refresh Timer */}
          {hasTicketForSelected && !isTicketScanned && (
            <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Auto-refresh in</span>
                <span className="text-blue-400 font-mono font-bold text-lg">{timeLeft}s</span>
              </div>
              <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border-2 border-gray-700">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(timeLeft / QR_ROTATION_SECONDS) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                QR auto-rotates for security • No wallet prompts needed
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}