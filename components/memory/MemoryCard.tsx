"use client";

import { motion } from "framer-motion";
import { Eye, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * MemoryCard Component
 *
 * Displays a single memory entry with:
 * - Memory key (title)
 * - Type badge (Insight/Preference/System)
 * - Value excerpt (first 100 chars)
 * - Last updated timestamp
 * - View button
 *
 * Features hover animations with blue glow and scale effect.
 */

interface MemoryCardProps {
  id: number | string;
  memoryKey: string;
  type: "Insight" | "Preference" | "System";
  value: string;
  updatedAt: string;
  onView: (id: number | string) => void;
}

export default function MemoryCard({
  id,
  memoryKey,
  type,
  value,
  updatedAt,
  onView,
}: MemoryCardProps) {
  // Determine badge color based on type
  const getBadgeColor = () => {
    switch (type) {
      case "Insight":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Preference":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "System":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // Truncate value to 100 characters
  const truncatedValue =
    value.length > 100 ? value.substring(0, 100) + "..." : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.03 }}
      className="group"
    >
      <Card className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col hover:shadow-[0_0_25px_-8px_#0229bf] transition-all duration-300 ease-in-out">
        {/* Header with Key and Type Badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#f5f5f5] flex-1 pr-2">
            {memoryKey}
          </h3>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getBadgeColor()}`}
          >
            {type}
          </span>
        </div>

        {/* Value Excerpt */}
        <p className="text-sm text-[#9ca3af] leading-relaxed flex-1 mb-4">
          {truncatedValue}
        </p>

        {/* Footer with Timestamp and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
          {/* Last Updated */}
          <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
            <Clock className="w-3.5 h-3.5" />
            <span>{updatedAt}</span>
          </div>

          {/* View Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onView(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0229bf]/10 hover:bg-[#0229bf]/20 text-[#0229bf] border border-[#0229bf]/30 rounded-lg text-xs font-medium transition-all duration-200"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}
