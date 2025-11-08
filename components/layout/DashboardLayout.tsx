"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Sidebar } from "../dashboard/Sidebar";
import { TopNav } from "../dashboard/TopNav";

/**
 * DashboardLayout Component
 *
 * Persistent layout wrapper for all dashboard pages.
 * Contains the sidebar and top navigation that remain visible across all routes.
 * Provides smooth page transitions and maintains Synth's dark aesthetic.
 */

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden border-l-2 border-[#0229bf]/20">
        {/* Top Navigation */}
        <TopNav />

        {/* Scrollable Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
