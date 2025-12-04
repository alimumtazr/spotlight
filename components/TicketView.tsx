"use client";
import { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSignMessage,
} from "wagmi";
import QRCode from "react-qr-code";
import { SPOTLIGHT_ABI } from "../abi";

const CONTRACT_ADDRESS = "0x0DC21BC674aF456411D98d01E79Ed98e7eaDFbe6";

export default function TicketView() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContract } = useWriteContract();

  const [hasTicket, setHasTicket] = useState(false);
  const [qrData, setQrData] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSigning, setIsSigning] = useState(false);
  const [isExpired, setIsExpired] = useState(false); // New state
  const isMounted = useRef(true);

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SPOTLIGHT_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (balance && Number(balance) > 0) {
      setHasTicket(true);
    }
  }, [balance]);

  const generateProof = async () => {
    if (!address || isSigning) return;

    setIsSigning(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const tokenId = "0";
      const message = `LOGIN:SPOTLIGHT:${tokenId}:${timestamp}:GIKI_EVENT`;

      const signature = await signMessageAsync({ message });

      if (isMounted.current) {
        const payload = JSON.stringify({
          address,
          tokenId,
          timestamp,
          signature,
        });
        setQrData(payload);
        setTimeLeft(30);
        setIsExpired(false); // Reset expired state
      }
    } catch (e) {
      console.log("Signature rejected", e);
    } finally {
      if (isMounted.current) setIsSigning(false);
    }
  };

  // Initial Load Only
  useEffect(() => {
    if (hasTicket && !qrData) {
      generateProof();
    }
  }, [hasTicket]);

  // Timer Logic (No Auto-Sign)
  useEffect(() => {
    if (!hasTicket || isExpired) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true); // Stop timer, show button
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, [hasTicket, isExpired]);

  if (!address)
    return <div className="p-4 text-center">Please Connect Wallet</div>;

  if (!hasTicket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <h1 className="text-3xl font-bold">GIKI Rave 2025</h1>
        <p className="text-gray-400">Secure. Anti-Scalp. On-Chain.</p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105"
          onClick={() =>
            writeContract({
              address: CONTRACT_ADDRESS,
              abi: SPOTLIGHT_ABI,
              functionName: "mintTicket",
              args: [],
            })
          }
        >
          Mint Ticket (Free)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-gray-900 rounded-3xl border border-gray-700 shadow-2xl max-w-sm mx-auto mt-10">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-white text-xl font-bold">VIP Access</h2>
        <span
          className={`${
            isExpired
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          } text-xs px-2 py-1 rounded transition-colors`}
        >
          {isExpired ? "EXPIRED" : "LIVE"}
        </span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-inner relative">
        {/* Blur the code when expired */}
        <div
          className={`transition-all duration-500 ${
            isExpired ? "blur-sm opacity-20" : "blur-0 opacity-100"
          }`}
        >
          {qrData ? (
            <QRCode value={qrData} size={220} />
          ) : (
            <div className="w-[220px] h-[220px]" />
          )}
        </div>

        {/* Show Button over the code when expired */}
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={generateProof}
              className="bg-black text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
              Tap to Refresh
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Security Refresh</span>
          <span>{timeLeft}s</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isExpired ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>

        <p className="text-[10px] text-gray-500 text-center mt-4 h-4">
          {isSigning
            ? "Requesting Signature..."
            : "Code rotates securely on-chain."}
        </p>
      </div>
    </div>
  );
}
