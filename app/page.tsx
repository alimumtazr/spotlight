"use client";
import { useState } from "react";
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
  const [selectedMode, setSelectedMode] = useState<"user" | "guard" | null>(null);

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
      <div className="w-full max-w-4xl mx-auto">
        {!isConnected ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 md:p-12 border-2 border-gray-800 shadow-2xl">
                <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                  SpotLight
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-2 font-medium">
                  The Un-Screenshot-able Ticket for Live Events
                </p>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                  No screenshots. No duplicates. No fraud. Your secure, blockchain-powered event access solution.
                </p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg px-4 py-2">
                    <span className="text-blue-300 text-sm font-semibold">🔐 Cryptographic Security</span>
                  </div>
                  <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-lg px-4 py-2">
                    <span className="text-purple-300 text-sm font-semibold">⏱️ Auto-Rotating QR</span>
                  </div>
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg px-4 py-2">
                    <span className="text-green-300 text-sm font-semibold">✅ One-Time Use</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="bg-gray-900 rounded-xl p-6 border-2 border-gray-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Mode</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedMode(selectedMode === "user" ? null : "user")}
                  type="button"
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedMode === "user"
                      ? "bg-blue-600/20 border-blue-500 shadow-lg scale-105"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🎫</div>
                    <h3 className="text-xl font-bold">User Mode</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Get tickets, view your QR codes, and enter events
                  </p>
                </button>

                <button
                  onClick={() => setSelectedMode(selectedMode === "guard" ? null : "guard")}
                  type="button"
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedMode === "guard"
                      ? "bg-blue-600/20 border-blue-500 shadow-lg scale-105"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🛡️</div>
                    <h3 className="text-xl font-bold">Guard Mode</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Create events, manage tickets, and scan QR codes
                  </p>
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 md:p-8 border-2 border-gray-800 shadow-xl">
              <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                About SpotLight
              </h2>
              
              <div className="space-y-6">
                {/* Problem */}
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">⚠️</div>
                    <h3 className="text-xl font-bold text-red-400">The Problem</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Traditional event ticketing systems suffer from critical vulnerabilities: tickets can be easily screenshotted and shared, 
                    leading to fraud and revenue loss. Physical tickets can be duplicated, and digital tickets lack real-time verification. 
                    Event organizers struggle with ticket scalping, unauthorized entry, and the inability to track genuine ticket usage. 
                    This creates security gaps and financial losses for both organizers and legitimate attendees.
                  </p>
                </div>

                {/* Solution */}
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">💡</div>
                    <h3 className="text-xl font-bold text-blue-400">Our Solution</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    SpotLight revolutionizes event ticketing with blockchain-powered, un-screenshot-able QR codes. Our system uses 
                    cryptographic signatures and time-based window rotation to create tickets that cannot be duplicated or reused. 
                    Each QR code refreshes every 30 seconds, making screenshots useless. The blockchain ensures one-time use, 
                    preventing fraud while providing real-time verification for event organizers.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="font-semibold text-blue-300 mb-1">🔐 Cryptographic Security</div>
                      <p className="text-xs text-gray-400">Blockchain signatures prevent forgery</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="font-semibold text-blue-300 mb-1">⏱️ Time-Window Rotation</div>
                      <p className="text-xs text-gray-400">QR codes auto-refresh every 30 seconds</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="font-semibold text-blue-300 mb-1">✅ One-Time Use</div>
                      <p className="text-xs text-gray-400">Tickets marked as used after scanning</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="font-semibold text-blue-300 mb-1">📊 Real-Time Tracking</div>
                      <p className="text-xs text-gray-400">Live stats for organizers</p>
                    </div>
                  </div>
                </div>

                {/* Future Prospects */}
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🚀</div>
                    <h3 className="text-xl font-bold text-green-400">Future Prospects</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    SpotLight is designed to scale across diverse use cases beyond traditional events. Our secure ticketing infrastructure 
                    is perfect for:
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="text-2xl">🚌</div>
                      <div>
                        <h4 className="font-semibold text-green-300 mb-1">GIKI Bus Ticket System</h4>
                        <p className="text-sm text-gray-400">
                          Secure bus ticket management for GIKI (Ghulam Ishaq Khan Institute) transportation. Students can purchase 
                          tickets on-chain, and bus operators can verify tickets in real-time, preventing ticket fraud and ensuring 
                          accurate passenger tracking.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="text-2xl">🏏</div>
                      <div>
                        <h4 className="font-semibold text-green-300 mb-1">Pakistan Cricket Matches</h4>
                        <p className="text-sm text-gray-400">
                          Revolutionize cricket match ticketing in Pakistan. Prevent ticket scalping, ensure fair distribution, 
                          and provide seamless entry verification at stadiums. Real-time scanning prevents duplicate entries and 
                          enhances security for high-profile matches.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="text-2xl">🎭</div>
                      <div>
                        <h4 className="font-semibold text-green-300 mb-1">Concerts, Festivals & More</h4>
                        <p className="text-sm text-gray-400">
                          Any live event requiring secure access control can benefit from SpotLight. From music festivals to 
                          conferences, our system provides tamper-proof ticketing with minimal infrastructure requirements.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="text-2xl">💬</div>
                      <div>
                        <h4 className="font-semibold text-green-300 mb-1">Global Event Chat</h4>
                        <p className="text-sm text-gray-400">
                          Coming soon: Integrated global chat system for events. Attendees can connect, share experiences, 
                          coordinate meetups, and engage in real-time discussions. Event organizers can broadcast announcements 
                          and create community spaces for their events.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Details */}
            {selectedMode && (
              <div className="bg-gray-900 rounded-xl p-6 md:p-8 border-2 border-gray-800 shadow-xl animate-slide-up">
                {selectedMode === "user" ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-4xl">🎫</div>
                      <h3 className="text-2xl font-bold">User Mode Workflow</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Connect Your Wallet</h4>
                          <p className="text-gray-400 text-sm">
                            Click the wallet button in the top-right corner and connect your MetaMask or other Web3 wallet.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Get a Ticket</h4>
                          <p className="text-gray-400 text-sm">
                            Click "Get Ticket" for the event you want to attend. This will mint your ticket on-chain and create it in the system.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                          3
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Sign Your Ticket</h4>
                          <p className="text-gray-400 text-sm">
                            Approve the signature request in your wallet (one-time per event). This creates a cryptographic proof of ownership.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                          4
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Show Your QR Code</h4>
                          <p className="text-gray-400 text-sm">
                            Your QR code auto-refreshes every 30 seconds for security. Show it to the guard at the event entrance. The QR cannot be screenshotted and reused!
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg">
                          ✓
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Enter the Event</h4>
                          <p className="text-gray-400 text-sm">
                            Once scanned, your ticket is marked as used. You can view event stats and switch between multiple events using the tabs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border-2 border-blue-500 rounded-lg">
                      <p className="text-sm text-blue-200">
                        <strong>💡 Tip:</strong> Your QR code rotates automatically every 30 seconds to prevent screenshots. No need to sign again - it uses the same signature with a rotating time window.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-4xl">🛡️</div>
                      <h3 className="text-2xl font-bold">Guard Mode Workflow</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Switch to Guard Mode</h4>
                          <p className="text-gray-400 text-sm">
                            Click "Guard Mode" in the top-left corner and connect your wallet. You'll need to be the event creator to manage it.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Create an Event</h4>
                          <p className="text-gray-400 text-sm">
                            Enter an event name and expiry date/time. Click "Create Event" to set it up. Expired events are automatically hidden.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
                          3
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Share Ticket Link</h4>
                          <p className="text-gray-400 text-sm">
                            Click "Copy Ticket Link" on your event to share it with attendees. They'll use this link to purchase tickets.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
                          4
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Select Event & Scan</h4>
                          <p className="text-gray-400 text-sm">
                            Select the active event you want to scan for, then choose a scanning method: Camera, Image Upload, or Manual Paste.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
                          5
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Verify Tickets</h4>
                          <p className="text-gray-400 text-sm">
                            The system verifies: signature validity, event match, expiry check, and prevents duplicate scans. QR codes older than 30 seconds are rejected.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg">
                          ✓
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Track Statistics</h4>
                          <p className="text-gray-400 text-sm">
                            Monitor sold and scanned ticket counts in real-time. View all your events and their status at a glance.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-purple-500/10 border-2 border-purple-500 rounded-lg">
                      <p className="text-sm text-purple-200">
                        <strong>🔒 Security:</strong> The scanner verifies cryptographic signatures, checks time windows (prevents screenshots), and ensures one-time use. Invalid or duplicate tickets are automatically rejected.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <TicketView />
        )}
      </div>
    </div>
  );
}
