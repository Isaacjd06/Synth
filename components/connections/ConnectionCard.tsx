"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ConnectionCard Component - Premium Design
 *
 * High-end integration card with professional styling.
 * Features:
 * - Dark gradient background (from-[#0c0c0c] to-[#070707])
 * - Subtle blue glow on hover
 * - Smooth scale and border animations
 * - Status indicator with tooltip
 * - Glowing icon when connected
 * - Premium shadcn/ui Button components
 */

interface ConnectionCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: "connected" | "disconnected";
  onConnect: () => void;
}

export default function ConnectionCard({
  name,
  description,
  icon: Icon,
  status,
  onConnect,
}: ConnectionCardProps) {
  const isConnected = status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className="group h-full"
    >
      <div className="relative h-full bg-gradient-to-b from-[#0c0c0c] to-[#070707] border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-[#0229bf] hover:shadow-[0_0_15px_rgba(2,41,191,0.2)] transition-all duration-200 ease-in-out">
        {/* Header: Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div
            className={`p-3 bg-zinc-900/50 rounded-lg border transition-all duration-200 ${
              isConnected
                ? "border-[#0229bf]/30 shadow-[0_0_10px_rgba(2,41,191,0.15)]"
                : "border-zinc-800"
            } group-hover:border-[#0229bf]/50`}
          >
            <Icon
              className={`w-12 h-12 transition-all duration-200 ${
                isConnected
                  ? "text-[#0229bf] drop-shadow-[0_0_8px_rgba(2,41,191,0.5)]"
                  : "text-zinc-600 group-hover:text-[#0229bf]"
              }`}
            />
          </div>

          {/* Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/80 border border-zinc-800"
            title={isConnected ? "Connected" : "Not connected"}
          >
            <motion.div
              animate={
                isConnected
                  ? {
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.6, 1],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-green-500" : "bg-zinc-600"
              }`}
            />
          </div>
        </div>

        {/* Name and Description */}
        <div className="flex-1 mb-5">
          <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={onConnect}
          variant={isConnected ? "outline" : "default"}
          className={`w-full transition-all duration-150 ${
            isConnected
              ? "bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900/50 hover:text-white hover:border-zinc-700"
              : "bg-[#0229bf] text-white hover:bg-[#0229bf]/90 shadow-[0_0_12px_rgba(2,41,191,0.3)] hover:shadow-[0_0_18px_rgba(2,41,191,0.4)]"
          }`}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>
    </motion.div>
  );
}
