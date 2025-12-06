"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  PlaySquare,
  MessageSquare,
  BookOpen,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Badge from "@/components/ui/Badge";
import { useSubscription } from "@/lib/useSubscription";
import Header from "@/components/ui/Header";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Executions", href: "/executions", icon: PlaySquare },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Settings", href: "/settings/connections", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isActive, isTrialValid } = useSubscription();

  const hasValidSubscription = isActive || isTrialValid;

  const isActiveRoute = (href: string) => {
    if (pathname === href) {
      return true;
    }

    // Special handling for /workflows
    if (href === "/workflows") {
      return (
        pathname === "/workflows" ||
        (pathname?.startsWith("/workflows/") && pathname !== "/workflows/create")
      );
    }

    // Special handling for /settings
    if (href === "/settings/connections") {
      return pathname?.startsWith("/settings/");
    }

    return false;
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || "U";

  const avatarUrl = user?.avatar_url || user?.image;

  return (
    <>
      <Header />
      <div className="flex min-h-screen pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-60 bg-[#0a0a0a] border-r border-gray-800 z-30 overflow-y-auto hidden lg:block">
          <nav className="p-3 flex flex-col h-full">
            <ul className="space-y-1 flex-1">
              {navigationItems.map((item) => {
                const active = isActiveRoute(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
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

            {/* Sidebar Footer with User Avatar */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-[#194c92] text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                {!hasValidSubscription && (
                  <Link href="/billing" className="block">
                    <Badge
                      variant="error"
                      className="w-full justify-center py-2 cursor-pointer hover:bg-red-900/40 transition-colors"
                    >
                      Upgrade Required
                    </Badge>
                  </Link>
                )}
                {hasValidSubscription && (
                  <Badge
                    variant="success"
                    className="w-full justify-center py-2"
                  >
                    Pro Active
                  </Badge>
                )}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 min-h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-240px)] overflow-x-hidden">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

