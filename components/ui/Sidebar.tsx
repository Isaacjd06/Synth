"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Workflow, 
  PlusCircle, 
  PlaySquare, 
  BookOpen,
  MessageSquare,
  Settings
} from "lucide-react";
import { useState } from "react";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Executions", href: "/executions", icon: PlaySquare },
  { label: "Settings", href: "/settings/connections", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    // Exact matches first
    if (pathname === href) {
      return true;
    }
    
    // Special handling for /workflows - should highlight on /workflows and /workflows/[id]
    // but NOT on /workflows/create (which has its own link)
    if (href === "/workflows") {
      return pathname === "/workflows" || 
        (pathname?.startsWith("/workflows/") && pathname !== "/workflows/create");
    }
    
    // Special handling for /settings - should highlight on any /settings/* route
    if (href === "/settings/connections") {
      return pathname?.startsWith("/settings/");
    }
    
    // All other routes use exact match only
    return false;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar - Fixed width on desktop, drawer on mobile */}
      <aside
        className={`
          fixed left-0 top-16 bottom-0 w-60 bg-[#0a0a0a] border-r border-gray-800 z-40 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <nav className="p-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setIsMobileOpen(false);
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      min-h-[44px] cursor-pointer
                      ${
                        active
                          ? "bg-[#194c92] text-white shadow-lg shadow-[#194c92]/20"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        w-5 h-5 flex-shrink-0
                        ${active ? "text-white" : "text-gray-400"}
                      `} 
                    />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

