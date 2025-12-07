"use client";
import TicketView from "../components/TicketView";
import ModeSwitcher from "../components/ModeSwitcher";
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans selection:bg-blue-500/30 flex items-center justify-center p-4">
      {/* Mode Switcher */}
      <ModeSwitcher />
      
      {/* Wallet Connect - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Wallet>
          <ConnectWallet className="bg-gray-900 rounded-lg px-4 py-2.5 border-2 border-gray-800 hover:border-blue-500 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
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

      {/* Main Content - Centered Container */}
      <div className="w-full max-w-2xl mx-auto">
        {!isConnected ? (
          <div className="text-center">
            <div className="bg-gray-900 rounded-xl p-8 md:p-12 border-2 border-gray-800 shadow-xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                SpotLight
              </h1>
              <p className="text-lg text-gray-400 mb-6">
                The un-screenshot-able ticket for live events.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700">
                <p className="text-blue-200 text-sm mb-2">
                  Connect your wallet to get started
                </p>
                <div className="animate-pulse bg-blue-500/20 h-1.5 w-32 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <TicketView />
        )}
      </div>
    </div>
  );
}
