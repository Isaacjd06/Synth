"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * ConnectionDialog Component
 *
 * Modal dialog for connecting/authorizing third-party integrations.
 * Features:
 * - Mock API token/key input form
 * - Animated success state with checkmark
 * - Backdrop blur and dark overlay
 * - Spring animation on open/close
 * - Blue accent styling consistent with Synth theme
 */

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  integrationName: string;
  integrationIcon: LucideIcon;
  onConnect: () => void;
}

export default function ConnectionDialog({
  isOpen,
  onClose,
  integrationName,
  integrationIcon: Icon,
  onConnect,
}: ConnectionDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;

    setIsConnecting(true);

    // Mock connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsConnecting(false);
    setIsSuccess(true);

    // Show success state briefly
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Reset and close
    onConnect();
    setIsSuccess(false);
    setApiKey("");
    onClose();
  };

  const handleClose = () => {
    if (isConnecting) return;
    setApiKey("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-[#f5f5f5]">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#0229bf]/10 rounded-lg border border-[#0229bf]/30">
                    <Icon className="w-5 h-5 text-[#0229bf]" />
                  </div>
                  <DialogTitle className="text-xl font-semibold">
                    Connect {integrationName}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-[#9ca3af]">
                  Enter your API key or authentication token to connect{" "}
                  {integrationName} with Synth.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                {/* API Key Input */}
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-[#f5f5f5] mb-2"
                  >
                    API Key / Auth Token
                  </label>
                  <input
                    id="apiKey"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_live_••••••••••••••••"
                    disabled={isConnecting}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[#f5f5f5] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0229bf] focus:ring-2 focus:ring-[#0229bf]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    disabled={isConnecting}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-[#f5f5f5] rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnect}
                    disabled={!apiKey.trim() || isConnecting}
                    className="flex-1 px-4 py-2.5 bg-[#0229bf] hover:bg-[#0229bf]/90 text-white rounded-lg font-medium text-sm shadow-[0_0_15px_-3px_#0229bf80] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Connecting...
                      </>
                    ) : (
                      "Save & Connect"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="w-16 h-16 bg-[#0229bf]/20 rounded-full flex items-center justify-center mb-4 border-2 border-[#0229bf]"
              >
                <Check className="w-8 h-8 text-[#0229bf]" />
              </motion.div>
              <h3 className="text-xl font-semibold text-[#f5f5f5] mb-2">
                Connected!
              </h3>
              <p className="text-[#9ca3af] text-center">
                {integrationName} has been successfully connected to Synth.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
