"use client";
import { useState } from "react";
import { verifyMessage } from "viem";

export default function ScannerPage() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "IDLE" | "SUCCESS" | "ERROR" | "EXPIRED"
  >("IDLE");
  const [scannedUser, setScannedUser] = useState("");

  const verifyTicket = async () => {
    try {
      // 1. Parse the QR Data
      const data = JSON.parse(input);
      const { address, tokenId, timestamp, signature } = data;

      // 2. Check Timestamp (Anti-Screenshot Logic)
      // We allow a 30-second window. If the QR code is older than 30s, it's rejected.
      const now = Math.floor(Date.now() / 1000);
      const age = now - timestamp;

      if (age > 30) {
        setStatus("EXPIRED");
        return;
      }

      // 3. Verify Cryptographic Signature using Viem
      // This checks: Did THIS address really sign THIS message with THIS signature?
      const isValid = await verifyMessage({
        address,
        message: `LOGIN:SPOTLIGHT:${tokenId}:${timestamp}:GIKI_EVENT`,
        signature,
      });

      if (isValid) {
        setStatus("SUCCESS");
        setScannedUser(address);
      } else {
        setStatus("ERROR");
      }
    } catch (e) {
      console.error(e);
      setStatus("ERROR");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        SpotLight Guard Terminal
      </h1>

      <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-gray-800">
        <label className="text-sm text-gray-400 mb-2 block">
          Paste QR Data (Simulated Scan)
        </label>

        {/* In a real PWA, you would use a camera library here. For hackathon, pasting is faster/safer to demo. */}
        <textarea
          className="w-full p-3 bg-gray-800 rounded-lg text-xs font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          placeholder='{"address": "0x...", ...}'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={verifyTicket}
          className="w-full mt-6 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          VERIFY TICKET
        </button>
      </div>

      <div className="mt-8 w-full max-w-md">
        {status === "SUCCESS" && (
          <div className="bg-green-500/20 border border-green-500 p-6 rounded-xl text-center animate-bounce">
            <h2 className="text-3xl font-black text-green-400">
              ACCESS GRANTED
            </h2>
            <p className="text-white mt-2 font-mono text-sm">
              User: {scannedUser.slice(0, 6)}...{scannedUser.slice(-4)}
            </p>
            <p className="text-green-200 text-xs mt-1">Signature Verified</p>
          </div>
        )}

        {status === "EXPIRED" && (
          <div className="bg-red-500/20 border border-red-500 p-6 rounded-xl text-center">
            <h2 className="text-3xl font-black text-red-500">EXPIRED</h2>
            <p className="text-red-300 mt-2">Screenshot Detected.</p>
            <p className="text-red-400 text-xs">
              Code is too old. Refresh app.
            </p>
          </div>
        )}

        {status === "ERROR" && (
          <div className="bg-red-900/50 border border-red-800 p-6 rounded-xl text-center">
            <h2 className="text-3xl font-black text-red-500">INVALID</h2>
            <p className="text-red-300 mt-2">Fake Ticket or Bad Signature.</p>
          </div>
        )}

        {status === "IDLE" && (
          <p className="text-gray-500 text-center text-sm">Ready to scan...</p>
        )}
      </div>
    </div>
  );
}
