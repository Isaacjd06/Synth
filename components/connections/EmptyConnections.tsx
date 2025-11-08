"use client";

import { motion } from "framer-motion";
import { Plug } from "lucide-react";

/**
 * EmptyConnections Component
 *
 * Empty state displayed when no integrations are connected.
 * Features:
 * - Centered layout with animated icon
 * - Glowing blue plug icon with pulse animation
 * - Call-to-action button to browse integrations
 * - Subtle fade-in animation
 */

export default function EmptyConnections() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      {/* Animated Icon */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-6"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[#0229bf]/30 blur-2xl rounded-full scale-150" />

        {/* Icon Container */}
        <div className="relative p-6 bg-neutral-900/70 border border-neutral-800 rounded-2xl">
          <Plug className="w-12 h-12 text-[#0229bf]" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Text Content */}
      <h3 className="text-2xl font-semibold text-[#f5f5f5] mb-2">
        No connections yet
      </h3>
      <p className="text-[#9ca3af] text-center max-w-md mb-8">
        Integrate Synth with your favorite tools to unlock powerful automations
        and workflows.
      </p>

      {/* Call-to-Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-3 bg-[#0229bf] hover:bg-[#0229bf]/90 text-white rounded-lg font-medium text-sm shadow-[0_0_20px_-5px_#0229bf80] transition-all duration-200 flex items-center gap-2"
      >
        <Plug className="w-4 h-4" />
        Browse Integrations
      </motion.button>
    </motion.div>
  );
}
