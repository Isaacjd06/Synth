"use client";

import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";

/**
 * EmptyChat Component
 *
 * Empty state displayed when no chat messages exist.
 * Features:
 * - Centered layout with floating message icon
 * - Blue glow animation with pulse effect
 * - Call-to-action messaging
 * - Floating y-axis animation
 * - Sparkle effects for visual interest
 */

interface EmptyChatProps {
  onStartChat?: () => void;
}

export default function EmptyChat({ onStartChat }: EmptyChatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full px-4 py-16"
    >
      {/* Animated Icon Container */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-8"
      >
        {/* Outer Glow Ring */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-[#0229bf]/30 blur-3xl rounded-full scale-150"
        />

        {/* Icon Container */}
        <div className="relative p-8 bg-neutral-900/70 border border-neutral-800 rounded-3xl shadow-[0_0_30px_-10px_#0229bf]">
          <MessageCircle
            className="w-16 h-16 text-[#0229bf]"
            strokeWidth={1.5}
          />

          {/* Sparkle Effect 1 */}
          <motion.div
            animate={{
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-[#3d5af1]" />
          </motion.div>

          {/* Sparkle Effect 2 */}
          <motion.div
            animate={{
              rotate: [360, 180, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-1 -left-1"
          >
            <Sparkles className="w-5 h-5 text-[#0229bf]" />
          </motion.div>
        </div>

        {/* Inner Pulse Ring */}
        <motion.div
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute inset-0 border-2 border-[#0229bf]/50 rounded-full"
        />
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center max-w-md"
      >
        <h2 className="text-2xl font-bold text-[#f5f5f5] mb-3">
          No messages yet
        </h2>
        <p className="text-[#9ca3af] leading-relaxed mb-2">
          Say hello to Synth to begin your conversation.
        </p>
        <p className="text-[#9ca3af] text-sm leading-relaxed mb-8">
          Your conversations are stored securely and remembered contextually for
          future interactions.
        </p>

        {/* Call-to-Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartChat}
          className="px-6 py-3 bg-gradient-to-r from-[#0229bf] to-[#3d5af1] text-white rounded-lg font-medium text-sm shadow-[0_0_25px_-8px_#0229bf] hover:shadow-[0_0_30px_-5px_#3d5af1] transition-all duration-200 flex items-center gap-2 mx-auto"
        >
          <MessageCircle className="w-4 h-4" />
          Start Chat
        </motion.button>
      </motion.div>

      {/* Background Floating Particles */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -120, 0],
              x: [0, Math.random() * 60 - 30, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 10 + i * 1.5,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut",
            }}
            className="absolute w-1.5 h-1.5 bg-[#0229bf] rounded-full blur-sm"
            style={{
              left: `${15 + i * 12}%`,
              top: `${25 + (i % 4) * 18}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
