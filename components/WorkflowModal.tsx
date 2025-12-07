"use client";
import { Fragment } from "react";

interface WorkflowModalProps {
  mode: "user" | "guard";
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkflowModal({ mode, isOpen, onClose }: WorkflowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl p-6 md:p-8 border-2 border-gray-800 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {mode === "user" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🎫</div>
                <h3 className="text-2xl font-bold">User Mode Workflow</h3>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                ×
              </button>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🛡️</div>
                <h3 className="text-2xl font-bold">Guard Mode Workflow</h3>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                ×
              </button>
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
                    Enter an event name, expiry date/time, and ticket price. Click "Create Event" to set it up. Expired events are automatically hidden.
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
    </div>
  );
}

