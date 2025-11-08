"use client";

import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";

/**
 * MemoryHeader Component
 *
 * Header section for the Memory page.
 * Displays title, subtitle, search input, and filter dropdown for memory types.
 * Features blue accent underline and fade-down animation on mount.
 */

interface MemoryHeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
}

export default function MemoryHeader({
  onSearch,
  onFilterChange,
}: MemoryHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col lg:flex-row lg:justify-between lg:items-center border-b border-neutral-800 py-6 px-8"
    >
      {/* Title and Subtitle */}
      <div className="mb-6 lg:mb-0">
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-1">
          Memory
          <div className="border-b-2 border-[#0229bf] w-fit mt-1"></div>
        </h1>
        <p className="text-[#9ca3af] text-sm mt-2">
          Explore what Synth remembers about you and your automations.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search memories..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-900/70 border border-neutral-800 rounded-lg text-[#f5f5f5] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0229bf] focus:ring-1 focus:ring-[#0229bf] transition-all duration-200 w-full sm:w-64"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <select
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="pl-10 pr-8 py-2 bg-neutral-900/70 border border-neutral-800 rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#0229bf] focus:ring-1 focus:ring-[#0229bf] transition-all duration-200 appearance-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="insight">Insights</option>
            <option value="preference">Preferences</option>
            <option value="system">System</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-[#9ca3af]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
