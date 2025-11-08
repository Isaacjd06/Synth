"use client";

import { motion } from "framer-motion";
import { Zap, GitBranch } from "lucide-react";

interface WorkflowNode {
  id: string;
  label: string;
}

interface WorkflowDiagramProps {
  nodes: WorkflowNode[];
}

/**
 * WorkflowDiagram - Visual representation of workflow nodes in a horizontal flow
 * Displays trigger and action nodes with animated connecting lines
 */
export function WorkflowDiagram({ nodes }: WorkflowDiagramProps) {
  return (
    <div className="h-[160px] flex justify-center items-center py-4 overflow-x-auto">
      <div className="flex items-center gap-4">
        {nodes.map((node, index) => {
          const isTrigger = index === 0;

          return (
            <div key={node.id} className="flex items-center gap-4">
              {/* Node Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[140px] h-[80px] px-4 py-3
                  rounded-xl border
                  ${
                    isTrigger
                      ? "bg-[#0229bf]/10 border-[#0229bf]/40 shadow-[0_0_15px_-5px_#0229bf]"
                      : "bg-neutral-900/80 border-neutral-700"
                  }
                  backdrop-blur-sm
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    mb-2
                    ${isTrigger ? "text-[#0229bf]" : "text-zinc-400"}
                  `}
                >
                  {isTrigger ? (
                    <Zap className="h-5 w-5" />
                  ) : (
                    <GitBranch className="h-5 w-5" />
                  )}
                </div>

                {/* Label */}
                <p
                  className={`
                    text-xs font-medium text-center line-clamp-2
                    ${isTrigger ? "text-zinc-200" : "text-zinc-300"}
                  `}
                >
                  {node.label}
                </p>

                {/* Glow effect for trigger */}
                {isTrigger && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-[#0229bf]/5"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Connector Arrow */}
              {index < nodes.length - 1 && (
                <motion.svg
                  width="40"
                  height="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                  className="flex-shrink-0"
                >
                  <motion.line
                    x1="0"
                    y1="1"
                    x2="40"
                    y2="1"
                    stroke="#525252"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    animate={{
                      strokeDashoffset: [0, -8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  {/* Arrow head */}
                  <polygon
                    points="40,1 36,3 36,-1"
                    fill="#525252"
                  />
                </motion.svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
