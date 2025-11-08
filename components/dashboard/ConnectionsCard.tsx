"use client";

import { motion } from "framer-motion";
import { Slack, Mail, FileText, Calendar, Github, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Connection {
  id: string;
  name: string;
  icon: any;
  status: "connected" | "disconnected";
}

const dummyConnections: Connection[] = [
  { id: "1", name: "Slack", icon: Slack, status: "connected" },
  { id: "2", name: "Gmail", icon: Mail, status: "connected" },
  { id: "3", name: "Notion", icon: FileText, status: "connected" },
  { id: "4", name: "Calendar", icon: Calendar, status: "disconnected" },
  { id: "5", name: "GitHub", icon: Github, status: "connected" },
];

export function ConnectionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="bg-[#151515] border-[#1f1f1f] rounded-xl p-5 hover:shadow-[0_0_10px_#0229bf40] transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Connections</h2>
          <span className="text-xs text-[#9ca3af]">
            {dummyConnections.filter((c) => c.status === "connected").length} active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {dummyConnections.map((connection, index) => {
            const Icon = connection.icon;
            return (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-lg",
                  "bg-[#0b0b0b] border border-[#1f1f1f]",
                  "hover:border-[#0229bf40] transition-all duration-200 cursor-pointer",
                  "group"
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute top-2 right-2 w-2 h-2 rounded-full",
                    connection.status === "connected" ? "bg-green-500" : "bg-red-500",
                    "shadow-[0_0_6px_currentColor]"
                  )}
                />

                <Icon className="w-8 h-8 text-[#9ca3af] group-hover:text-[#f5f5f5] transition-colors" />
                <span className="mt-2 text-xs text-[#9ca3af] group-hover:text-[#f5f5f5] font-medium">
                  {connection.name}
                </span>
              </motion.div>
            );
          })}

          {/* Add new connection button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + dummyConnections.length * 0.05 }}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg",
              "bg-[#0b0b0b] border border-dashed border-[#1f1f1f]",
              "hover:border-[#0229bf] hover:bg-[#0229bf10] transition-all duration-200",
              "group"
            )}
          >
            <Plus className="w-8 h-8 text-[#9ca3af] group-hover:text-[#0229bf] transition-colors" />
            <span className="mt-2 text-xs text-[#9ca3af] group-hover:text-[#0229bf] font-medium">
              Add New
            </span>
          </motion.button>
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-[#0229bf] hover:text-[#3d5af1] hover:bg-[#0229bf10]"
        >
          Manage Connections
        </Button>
      </Card>
    </motion.div>
  );
}
