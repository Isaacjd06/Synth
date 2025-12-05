"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/ui/Sidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell component that wraps the sidebar and main content.
 * Uses fixed sidebar width (240px) on desktop.
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Sidebar />
      <main className="lg:ml-60 mt-16 min-h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-240px)] overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
