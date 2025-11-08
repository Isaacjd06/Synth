"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

/**
 * EmptyMemory Component
 *
 * Empty state displayed when no memories exist in Synth.
 * Features:
 * - Centered layout with floating brain icon
 * - Blue glow animation with subtle pulse
 * - Call-to-action button
 * - Neural-inspired aesthetic
 * - Floating animation with y-axis movement
 */

interface EmptyMemoryProps {
  onGetStarted?: () => void;
}

export default function EmptyMemory({ onGetStarted }: EmptyMemoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-[65vh] px-4"
    >
      {/* Animated Icon Container */}
      <motion.div
        animate={{
          y: [0, -8, 0],
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
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-[#0229bf]/30 blur-3xl rounded-full scale-150"
        />

        {/* Icon Container */}
        <div className="relative p-8 bg-neutral-900/70 border border-neutral-800 rounded-3xl shadow-[0_0_25px_-10px_#0229bf]">
          <Brain className="w-16 h-16 text-[#0229bf]" strokeWidth={1.5} />

          {/* Sparkle Effect */}
          <motion.div
            animate={{
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-[#0229bf]" />
          </motion.div>
        </div>

        {/* Inner Pulse Ring */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
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
          Synth has no memories yet
        </h2>
        <p className="text-[#9ca3af] leading-relaxed mb-8">
          Once you start using workflows and interacting with Synth, it will
          begin to remember your preferences, patterns, and insights to serve
          you better.
        </p>

        {/* Call-to-Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGetStarted}
          className="px-6 py-3 bg-[#0229bf] hover:bg-[#0229bf]/90 text-white rounded-lg font-medium text-sm shadow-[0_0_20px_-5px_#0229bf80] transition-all duration-200 flex items-center gap-2 mx-auto"
        >
          <Brain className="w-4 h-4" />
          Start Using Synth
        </motion.button>
      </motion.div>

      {/* Background Neural Particles (Optional) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut",
            }}
            className="absolute w-1 h-1 bg-[#0229bf] rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
