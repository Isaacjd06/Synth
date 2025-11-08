"use client";

import { motion } from "framer-motion";
import { Play, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Workflow {
  id: string;
  name: string;
  status: "active" | "idle" | "error";
  lastRun?: string;
}

interface WorkflowCardProps {
  workflows?: Workflow[];
}

const dummyWorkflows: Workflow[] = [
  { id: "1", name: "Daily Email Digest", status: "active", lastRun: "2 hours ago" },
  { id: "2", name: "Slack Notifier", status: "active", lastRun: "5 hours ago" },
  { id: "3", name: "Data Sync Pipeline", status: "idle", lastRun: "1 day ago" },
  { id: "4", name: "Content Aggregator", status: "error", lastRun: "3 days ago" },
  { id: "5", name: "Report Generator", status: "active", lastRun: "12 hours ago" },
];

export function WorkflowCard({ workflows = dummyWorkflows }: WorkflowCardProps) {
  const getStatusColor = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return "bg-[#0229bf20] text-[#3d5af1]";
      case "idle":
        return "bg-[#9ca3af20] text-[#9ca3af]";
      case "error":
        return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="bg-[#151515] border-[#1f1f1f] rounded-xl p-5 hover:shadow-[0_0_10px_#0229bf40] transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Recent Workflows</h2>
          <span className="text-xs text-[#9ca3af]">{workflows.length} total</span>
        </div>

        <div className="space-y-3">
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0b0b0b] border border-[#1f1f1f] hover:border-[#0229bf40] transition-all"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#f5f5f5] truncate">
                  {workflow.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      getStatusColor(workflow.status)
                    )}
                  >
                    {workflow.status}
                  </span>
                  {workflow.lastRun && (
                    <span className="flex items-center gap-1 text-xs text-[#9ca3af]">
                      <Clock className="w-3 h-3" />
                      {workflow.lastRun}
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                className={cn(
                  "ml-3 bg-[#0229bf] hover:bg-[#3d5af1] text-white",
                  "transition-all duration-200 hover:shadow-[0_0_10px_#0229bf60]"
                )}
              >
                <Play className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-[#0229bf] hover:text-[#3d5af1] hover:bg-[#0229bf10]"
        >
          View All Workflows
        </Button>
      </Card>
    </motion.div>
  );
}
