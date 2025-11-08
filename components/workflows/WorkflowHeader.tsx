"use client";

import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowHeaderProps {
  onSearch?: (query: string) => void;
  onCreateWorkflow?: () => void;
  onFilterChange?: (filter: string) => void;
}

/**
 * WorkflowHeader - Top navigation and controls for the workflows page
 * Features search, create workflow button, and status filter
 */
export function WorkflowHeader({
  onSearch,
  onCreateWorkflow,
  onFilterChange,
}: WorkflowHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-neutral-800 py-6 px-8"
    >
      {/* Title Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-zinc-200">Your Workflows</h1>
        <p className="text-sm text-zinc-400">
          Manage and monitor your automation workflows
        </p>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search workflows..."
            className="pl-10 bg-neutral-900/60 border-neutral-800 text-zinc-200 placeholder:text-zinc-500 focus:border-[#0229bf] focus:ring-[#0229bf]/20"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-neutral-900/60 border-neutral-800 text-zinc-200 hover:bg-neutral-800 hover:text-zinc-100"
            >
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-neutral-900 border-neutral-800">
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer"
              onClick={() => onFilterChange?.("all")}
            >
              All Workflows
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer"
              onClick={() => onFilterChange?.("active")}
            >
              Active Only
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer"
              onClick={() => onFilterChange?.("inactive")}
            >
              Inactive Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Workflow Button */}
        <Button
          onClick={onCreateWorkflow}
          className="bg-[#0229bf] hover:bg-[#0229bf]/90 text-white font-medium shadow-[0_0_25px_-10px_#0229bf] hover:shadow-[0_0_30px_-5px_#0229bf] transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>
    </motion.div>
  );
}
