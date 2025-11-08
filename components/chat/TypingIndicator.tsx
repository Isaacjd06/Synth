"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

/**
 * TypingIndicator Component
 *
 * Shows an animated typing indicator when Synth is composing a response.
 * Features:
 * - Three pulsing dots with staggered animation
 * - Brain avatar matching Synth's message style
 * - Subtle fade-in animation
 * - Positioned below Synth's latest message
 */

export default function TypingIndicator() {
  // Staggered dot animation variants
  const dotVariants = {
    initial: { opacity: 0.3 },
    animate: { opacity: 1 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 mb-4"
    >
      {/* Synth Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0229bf]/20 border border-[#0229bf]/40 flex items-center justify-center">
        <Brain className="w-4 h-4 text-[#0229bf]" />
      </div>

      {/* Typing Bubble */}
      <div className="flex items-center px-5 py-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-[0_0_15px_-8px_#0229bf40]">
        <div className="flex gap-1.5">
          {/* Dot 1 */}
          <motion.div
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0,
            }}
            className="w-2 h-2 bg-[#3d5af1] rounded-full"
          />

          {/* Dot 2 */}
          <motion.div
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.2,
            }}
            className="w-2 h-2 bg-[#3d5af1] rounded-full"
          />

          {/* Dot 3 */}
          <motion.div
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.4,
            }}
            className="w-2 h-2 bg-[#3d5af1] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
