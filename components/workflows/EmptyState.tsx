"use client";

import { motion } from "framer-motion";
import { Brain, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateWorkflow?: () => void;
}

/**
 * EmptyState - Displayed when no workflows exist
 * Encourages users to create their first automation workflow
 */
export function EmptyState({ onCreateWorkflow }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[500px] px-4"
    >
      {/* Animated Brain Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-8"
      >
        {/* Outer Glow */}
        <motion.div
          className="absolute inset-0 blur-2xl bg-[#0229bf]/30 rounded-full"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Icon */}
        <div className="relative bg-gradient-to-br from-[#0229bf]/20 to-[#0229bf]/5 border border-[#0229bf]/30 rounded-full p-8 shadow-[0_0_30px_-5px_#0229bf]">
          <Brain className="h-16 w-16 text-[#0229bf]" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-zinc-200 mb-2">
          No workflows yet
        </h2>
        <p className="text-zinc-400 max-w-md">
          Create your first automation workflow to start building powerful
          integrations and streamline your processes.
        </p>
      </motion.div>

      {/* Create Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          onClick={onCreateWorkflow}
          className="relative bg-gradient-to-r from-[#0229bf] to-[#0229bf]/80 hover:from-[#0229bf]/90 hover:to-[#0229bf]/70 text-white font-medium shadow-[0_0_30px_-5px_#0229bf] hover:shadow-[0_0_40px_0px_#0229bf] transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Your First Workflow
        </Button>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left Glow */}
        <motion.div
          className="absolute -top-32 -left-32 w-64 h-64 bg-[#0229bf]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Bottom Right Glow */}
        <motion.div
          className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#0229bf]/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5,
          }}
        />
      </div>
    </motion.div>
  );
}
