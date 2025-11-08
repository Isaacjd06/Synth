"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { User, Brain } from "lucide-react";

/**
 * MessageBubble Component
 *
 * Displays a single chat message from either the user or Synth.
 * Features:
 * - Two variants: 'user' (right-aligned, blue gradient) and 'synth' (left-aligned, dark with glow)
 * - Avatar icon (User for user messages, Brain for Synth)
 * - Message text with proper formatting (supports string or ReactNode for buttons)
 * - Optional timestamp
 * - Slide-up + fade-in animation on mount
 * - Hover glow effect
 */

interface MessageBubbleProps {
  role: "user" | "synth";
  message: string | ReactNode;
  time?: string;
}

export default function MessageBubble({
  role,
  message,
  time,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Synth Avatar (left side) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0229bf]/20 border border-[#0229bf]/40 flex items-center justify-center">
          <Brain className="w-4 h-4 text-[#0229bf]" />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Message Bubble */}
        <motion.div
          whileHover={{
            boxShadow: isUser
              ? "0 0 20px -8px rgba(2, 41, 191, 0.6)"
              : "0 0 20px -8px rgba(61, 90, 241, 0.4)",
          }}
          className={`max-w-[75%] p-4 rounded-2xl shadow-lg ${
            isUser
              ? "bg-gradient-to-br from-[#0229bf] to-[#3d5af1] text-white"
              : "bg-neutral-900/90 border border-neutral-800 text-[#f5f5f5] shadow-[0_0_15px_-8px_#0229bf40]"
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </div>
        </motion.div>

        {/* Timestamp */}
        {time && (
          <span className="text-xs text-[#9ca3af] mt-1 px-1">{time}</span>
        )}
      </div>

      {/* User Avatar (right side) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#0229bf] to-[#3d5af1] flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
