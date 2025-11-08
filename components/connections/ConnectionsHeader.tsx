"use client";

import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ConnectionsHeader Component
 *
 * Header section for the Connections page.
 * Displays title, subtitle, search input, and filter dropdown.
 * Features blue accent underline and responsive layout.
 */

export default function ConnectionsHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col lg:flex-row lg:justify-between lg:items-center px-8 py-6 border-b border-neutral-800/50"
    >
      {/* Title and Subtitle */}
      <div className="mb-6 lg:mb-0">
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-2">
          Connections
          <div className="border-b-2 border-[#0229bf] w-fit mt-1"></div>
        </h1>
        <p className="text-[#9ca3af] text-sm">
          Manage integrations between Synth and your favorite apps.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search integrations..."
            className="pl-10 pr-4 py-2 bg-neutral-900/70 border border-neutral-800 rounded-lg text-[#f5f5f5] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0229bf] focus:ring-1 focus:ring-[#0229bf] transition-all duration-200 w-full sm:w-64"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <select className="pl-10 pr-8 py-2 bg-neutral-900/70 border border-neutral-800 rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#0229bf] focus:ring-1 focus:ring-[#0229bf] transition-all duration-200 appearance-none cursor-pointer w-full sm:w-auto">
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
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
