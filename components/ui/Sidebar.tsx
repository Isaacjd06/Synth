"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Workflows", href: "/workflows" },
  { label: "Create Workflow", href: "/workflows/create" },
  { label: "Executions", href: "/executions" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-[#0a0a0a] border-r border-gray-800 z-[9] overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/workflows" && pathname?.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    block px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-[#194c92] text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }
                  `}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

