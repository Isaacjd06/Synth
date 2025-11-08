"use client";

import { motion } from "framer-motion";
import { WorkflowCard } from "./WorkflowCard";
import { ConnectionsCard } from "./ConnectionsCard";
import { MemoryCard } from "./MemoryCard";
import { ChatCard } from "./ChatCard";

export function DashboardGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 ml-20 mt-16"
    >
      {/* Recent Workflows - Takes full width on mobile, half on desktop */}
      <div className="md:col-span-1">
        <WorkflowCard />
      </div>

      {/* Connections - Takes full width on mobile, half on desktop */}
      <div className="md:col-span-1">
        <ConnectionsCard />
      </div>

      {/* Memory - Takes full width on mobile, half on desktop */}
      <div className="md:col-span-1">
        <MemoryCard />
      </div>

      {/* Chat - Takes full width on mobile, half on desktop */}
      <div className="md:col-span-1">
        <ChatCard />
      </div>
    </motion.div>
  );
}
