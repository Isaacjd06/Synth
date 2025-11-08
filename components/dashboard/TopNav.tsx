"use client";

import Image from "next/image";
import { Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  title?: string;
}

export function TopNav({ title = "Dashboard" }: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0b0b0b]/80 backdrop-blur-md border-b border-[#1f1f1f]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left section - Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/synth-logo.png"
              alt="Synth"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-[#f5f5f5] text-xl font-semibold tracking-wide">
            Synth
          </span>
        </div>

        {/* Center section - Page title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-[#f5f5f5] text-sm font-medium">{title}</h1>
        </div>

        {/* Right section - User actions */}
        <div className="flex items-center gap-4">
          <button
            className={cn(
              "p-2 rounded-lg text-[#9ca3af] hover:text-[#f5f5f5]",
              "hover:bg-[#151515] transition-all duration-200",
              "hover:shadow-[0_0_10px_#0229bf40]"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            className={cn(
              "p-2 rounded-lg text-[#9ca3af] hover:text-[#f5f5f5]",
              "hover:bg-[#151515] transition-all duration-200",
              "hover:shadow-[0_0_10px_#0229bf40]"
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div
            className={cn(
              "w-9 h-9 rounded-full bg-[#151515] border border-[#1f1f1f]",
              "flex items-center justify-center text-[#f5f5f5] text-sm font-medium",
              "hover:border-[#0229bf] transition-all duration-200 cursor-pointer"
            )}
          >
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
