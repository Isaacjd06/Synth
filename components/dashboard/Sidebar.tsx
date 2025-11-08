"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Workflow, Link2, Database, MessageSquare, Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
  { icon: Link2, label: "Connections", href: "/connections" },
  { icon: Database, label: "Memory", href: "/memory" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 240 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-16 bottom-0 bg-[#0b0b0b] border-r border-[#1f1f1f] z-40"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#151515]",
                isActive && "bg-[#151515] text-[#f5f5f5] border-l-2 border-[#0229bf]",
                !isActive && "hover:shadow-[0_0_10px_#0229bf20]"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Toggle indicator */}
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 right-4 text-[#9ca3af]"
      >
        <ChevronRight className="w-4 h-4" />
      </motion.div>
    </motion.aside>
  );
}
