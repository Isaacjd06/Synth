"use client";

import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

/**
 * MessageComposer Component
 *
 * Fixed bottom input bar for composing and sending messages to Synth.
 * Features:
 * - Auto-resizing textarea input
 * - Glowing blue send button with gradient
 * - Keyboard shortcuts: Enter to send, Shift+Enter for newline
 * - Blue border glow when focused
 * - Backdrop blur for glassmorphism effect
 * - Disabled state when message is empty
 */

interface MessageComposerProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageComposer({
  onSendMessage,
  disabled = false,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Handle send message
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter adds a newline (default behavior)
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-neutral-800 bg-neutral-900/70 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-8 py-4">
        <div className="flex items-end gap-4">
          {/* Input Field */}
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Synth anything..."
              disabled={disabled}
              rows={1}
              className={`w-full px-4 py-3 bg-neutral-900 border rounded-xl text-[#f5f5f5] text-sm placeholder:text-[#9ca3af] focus:outline-none transition-all duration-200 resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFocused
                  ? "border-[#0229bf] ring-2 ring-[#0229bf]/20"
                  : "border-neutral-800"
              }`}
              style={{
                minHeight: "44px",
                maxHeight: "128px",
              }}
            />
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!canSend}
            className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
              canSend
                ? "bg-gradient-to-r from-[#0229bf] to-[#3d5af1] text-white shadow-[0_0_20px_-5px_#0229bf] hover:shadow-[0_0_25px_-3px_#3d5af1]"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-[#9ca3af]">
            Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs">Enter</kbd> to send,{" "}
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
