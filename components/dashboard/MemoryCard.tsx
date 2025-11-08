"use client";

import { motion } from "framer-motion";
import { Database, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MemoryItem {
  key: string;
  value: string;
  type?: "string" | "number" | "boolean";
}

const dummyMemory: MemoryItem[] = [
  { key: "onboarding_stage", value: "complete", type: "string" },
  { key: "total_workflows", value: "12", type: "number" },
  { key: "last_login", value: "2024-01-15", type: "string" },
  { key: "premium_user", value: "true", type: "boolean" },
  { key: "notifications_enabled", value: "true", type: "boolean" },
  { key: "theme_preference", value: "dark", type: "string" },
];

export function MemoryCard() {
  const getValueColor = (type?: string) => {
    switch (type) {
      case "boolean":
        return "text-[#3d5af1]";
      case "number":
        return "text-green-400";
      default:
        return "text-[#9ca3af]";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="bg-[#151515] border-[#1f1f1f] rounded-xl p-5 hover:shadow-[0_0_10px_#0229bf40] transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0229bf]" />
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Memory Highlights</h2>
          </div>
          <span className="text-xs text-[#9ca3af]">{dummyMemory.length} items</span>
        </div>

        <div className="space-y-2">
          {dummyMemory.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-[#0b0b0b] border border-[#1f1f1f]",
                "hover:border-[#0229bf40] transition-all duration-200",
                "group"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-mono text-[#f5f5f5] truncate">
                  {item.key}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-mono font-medium", getValueColor(item.type))}>
                  {item.value}
                </span>
                {item.type === "number" && (
                  <TrendingUp className="w-3 h-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-[#0229bf] hover:text-[#3d5af1] hover:bg-[#0229bf10]"
        >
          View All Memory
        </Button>
      </Card>
    </motion.div>
  );
}
