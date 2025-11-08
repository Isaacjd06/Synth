"use client";

import { motion } from "framer-motion";
import { MoreVertical, Eye, Edit, Play, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface WorkflowActionsProps {
  workflowId: number | string;
  onView?: (id: number | string) => void;
  onEdit?: (id: number | string) => void;
  onRun?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
}

/**
 * WorkflowActions - Dropdown menu for workflow operations
 * Provides View, Edit, Run, and Delete actions
 */
export function WorkflowActions({
  workflowId,
  onView,
  onEdit,
  onRun,
  onDelete,
}: WorkflowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-neutral-800"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48 bg-neutral-900 border-neutral-800"
      >
        {/* View Action */}
        <DropdownMenuItem
          onClick={() => onView?.(workflowId)}
          className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer group"
        >
          <Eye className="h-4 w-4 mr-3 text-zinc-400 group-hover:text-[#0229bf] transition-colors" />
          View Workflow
        </DropdownMenuItem>

        {/* Edit Action */}
        <DropdownMenuItem
          onClick={() => onEdit?.(workflowId)}
          className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer group"
        >
          <Edit className="h-4 w-4 mr-3 text-zinc-400 group-hover:text-[#0229bf] transition-colors" />
          Edit Workflow
        </DropdownMenuItem>

        {/* Run Action */}
        <DropdownMenuItem
          onClick={() => onRun?.(workflowId)}
          className="text-zinc-200 focus:bg-neutral-800 focus:text-zinc-100 cursor-pointer group"
        >
          <Play className="h-4 w-4 mr-3 text-zinc-400 group-hover:text-[#0229bf] transition-colors" />
          Run Now
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-neutral-800" />

        {/* Delete Action */}
        <DropdownMenuItem
          onClick={() => onDelete?.(workflowId)}
          className="text-red-400 focus:bg-red-950/50 focus:text-red-300 cursor-pointer group"
        >
          <Trash2 className="h-4 w-4 mr-3 group-hover:text-red-400 transition-colors" />
          Delete Workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
