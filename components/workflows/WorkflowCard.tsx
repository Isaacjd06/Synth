"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkflowDiagram } from "./WorkflowDiagram";
import { WorkflowActions } from "./WorkflowActions";

interface WorkflowNode {
  id: string;
  label: string;
}

interface Workflow {
  id: number | string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  lastRun: string;
  nodes: WorkflowNode[];
}

interface WorkflowCardProps {
  workflow: Workflow;
  index: number;
  onView?: (id: number | string) => void;
  onEdit?: (id: number | string) => void;
  onRun?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
}

/**
 * WorkflowCard - Individual workflow card component
 * Displays workflow metadata, status, diagram preview, and actions
 */
export function WorkflowCard({
  workflow,
  index,
  onView,
  onEdit,
  onRun,
  onDelete,
}: WorkflowCardProps) {
  const isActive = workflow.status === "Active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className="group relative bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 hover:shadow-[0_0_25px_-10px_#0229bf] transition-all cursor-pointer"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Title and Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors">
              {workflow.name}
            </h3>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`
                text-xs font-medium
                ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-neutral-800 text-zinc-400 border-neutral-700"
                }
              `}
            >
              {workflow.status}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
            {workflow.description}
          </p>

          {/* Last Run */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            <span>Last run: {workflow.lastRun}</span>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="ml-4">
          <WorkflowActions
            workflowId={workflow.id}
            onView={onView}
            onEdit={onEdit}
            onRun={onRun}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Workflow Diagram Preview */}
      <div className="mt-6 border-t border-neutral-800 pt-4">
        <WorkflowDiagram nodes={workflow.nodes} />
      </div>

      {/* Subtle glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-[#0229bf]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  );
}
