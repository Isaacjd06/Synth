"use client";

import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * ConnectionsHeader Component
 *
 * Premium header section for the Connections page.
 * Features:
 * - Large bold title with descriptive subtitle
 * - Connection status summary (connected/disconnected count)
 * - Search bar with shadcn/ui Input component
 * - Filter button with icon
 * - Smooth fade-in animation
 */

interface ConnectionsHeaderProps {
  connectedCount: number;
  disconnectedCount: number;
}

export default function ConnectionsHeader({
  connectedCount,
  disconnectedCount,
}: ConnectionsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-8 py-8 border-b border-zinc-800/50"
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
        {/* Title, Subtitle, and Status */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Connections
          </h1>
          <p className="text-zinc-500 text-sm mb-3 max-w-2xl">
            Link Synth with your favorite platforms to unlock automation across
            your workflow.
          </p>
          {/* Status Summary */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {connectedCount} connected
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {disconnectedCount} not connected
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 lg:items-start">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10" />
            <Input
              type="text"
              placeholder="Search integrations..."
              className="pl-10 pr-4 py-2 bg-[#0c0c0c] border-zinc-800 rounded-lg text-white text-sm placeholder:text-zinc-600 focus:border-[#0229bf] focus:ring-1 focus:ring-[#0229bf]/50 transition-all duration-200 w-full sm:w-64 h-9"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="bg-[#0c0c0c] border-zinc-800 text-zinc-400 hover:text-white hover:border-[#0229bf] hover:bg-[#0c0c0c] transition-all duration-200 h-9 px-3"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
