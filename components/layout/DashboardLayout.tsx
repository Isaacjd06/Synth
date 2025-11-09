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
 *
 * The sidebar is fixed positioned and takes up 80px (collapsed) width.
 * Main content area has left padding to account for the sidebar.
 */

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Persistent Fixed Sidebar - Always visible as slim icon column */}
      <Sidebar />

      {/* Main Content Area - Offset by sidebar width */}
      <div className="ml-[80px] h-full flex flex-col overflow-hidden">
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
