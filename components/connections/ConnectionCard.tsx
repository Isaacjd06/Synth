"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * ConnectionCard Component
 *
 * Individual integration card displaying service information and connection status.
 * Features:
 * - Service logo/icon, name, and description
 * - Status indicator (green dot for connected, gray for disconnected)
 * - Connect/Disconnect button
 * - Hover animations with blue glow effect
 * - Scale animation on hover
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
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
      className="group"
    >
      <Card className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col hover:shadow-[0_0_20px_-5px_#0229bf80] transition-all duration-200 ease-in-out">
        {/* Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 group-hover:border-[#0229bf]/50 transition-colors duration-200">
            <Icon className="w-6 h-6 text-[#0229bf]" />
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-500"
              }`}
            />
            <span className="text-xs text-[#9ca3af] font-medium">
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>

        {/* Name and Description */}
        <div className="flex-1 mb-4">
          <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
            {name}
          </h3>
          <p className="text-sm text-[#9ca3af] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onConnect}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            isConnected
              ? "bg-neutral-800 text-[#f5f5f5] hover:bg-neutral-700 border border-neutral-700"
              : "bg-[#0229bf] text-white hover:bg-[#0229bf]/90 shadow-[0_0_15px_-3px_#0229bf80]"
          }`}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </motion.button>
      </Card>
    </motion.div>
  );
}
