"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

/**
 * ChatHeader Component
 *
 * Header section for the Chat page.
 * Features:
 * - Title "Chat with Synth" with blue accent underline
 * - Subtitle describing Synth's capabilities
 * - Pulsing blue orb indicator showing Synth is online
 * - Fade-down animation on mount
 * - Clean, minimal layout with border bottom
 */

export default function ChatHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between px-8 py-6 border-b border-neutral-800"
    >
      {/* Title and Subtitle */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-[#f5f5f5]">
            Chat with Synth
          </h1>

          {/* Online Indicator - Pulsing Blue Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer Pulse Ring */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-3 h-3 bg-[#0229bf] rounded-full"
            />
            {/* Core Dot */}
            <motion.div
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-[#3d5af1] rounded-full shadow-[0_0_10px_#3d5af1]"
            />
          </div>
        </div>

        {/* Accent Underline */}
        <div className="border-b-2 border-[#0229bf] w-fit mb-2"></div>

        <p className="text-[#9ca3af] text-sm">
          Your AI brain, always remembering.
        </p>
      </div>

      {/* Optional: Brain Icon */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0229bf]/10 border border-[#0229bf]/30 rounded-lg">
        <Brain className="w-4 h-4 text-[#0229bf]" />
        <span className="text-sm text-[#0229bf] font-medium">Active</span>
      </div>
    </motion.div>
  );
}
