"use client";
import Link from "next/link";
import TicketView from "../components/TicketView";
import { useAccount } from "wagmi";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

export default function Page() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* --- HEADER: SMART WALLET CONNECT --- */}
      <div className="fixed top-0 right-0 p-4 z-50">
        <Wallet>
          <ConnectWallet className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 pt-20 pb-10">
        {!isConnected ? (
          // STATE 1: WALLET NOT CONNECTED (Landing Page)
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-6xl md:text-8xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              SpotLight
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-lg mx-auto">
              The un-screenshot-able ticket for GIKI Raves.
              <span className="block text-sm mt-2 text-gray-600">
                Powered by Base & Smart Wallets
              </span>
            </p>

            <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-500/50 to-purple-500/50 max-w-md mx-auto">
              <div className="bg-gray-900 rounded-xl p-6">
                <p className="text-blue-200 font-mono text-sm mb-4">
                  Connect your wallet to mint access.
                </p>
                <div className="animate-pulse bg-blue-500/20 h-2 w-32 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          // STATE 2: WALLET CONNECTED (Show The Ticket App)
          <TicketView />
        )}
      </main>

      {/* --- FOOTER: LINKS --- */}
      <footer className="w-full text-center py-6 text-gray-600 text-xs border-t border-gray-900">
        <div className="flex justify-center gap-4 mb-2">
          {/* Link to the Guard Scanner Page */}
          <Link
            href="/scanner"
            className="hover:text-white transition-colors underline decoration-blue-500 underline-offset-4"
          >
            Open Guard Terminal
          </Link>
        </div>
        <p>Built for Base Hackathon 2025</p>
      </footer>
    </div>
  );
}
