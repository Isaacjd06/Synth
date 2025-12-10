"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Workflow,
  PlaySquare,
  CreditCard,
  Sparkles,
  Menu,
  X,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Skills", href: "/knowledge", icon: Sparkles },
  { title: "Workflows", href: "/workflows", icon: Workflow },
  { title: "Executions", href: "/executions", icon: PlaySquare },
  { title: "Connections", href: "/connections", icon: Plug },
  { title: "Billing", href: "/billing", icon: CreditCard },
];

// Helper to normalize paths for comparison
const normalizePath = (path: string) => {
  return path.replace(/\/$/, '').replace(/^\/app/, '');
};

// Track if sidebar has ever animated - global singleton
let sidebarHasAnimated = false;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if we should animate - only once ever on first app load
  const shouldAnimate = useMemo(() => {
    if (!isMounted || sidebarHasAnimated) {
      return false;
    }
    sidebarHasAnimated = true;
    return true;
  }, [isMounted]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // Normalize both paths (remove /app prefix and trailing slashes)
    const normalizedPathname = normalizePath(pathname);
    const normalizedHref = normalizePath(href);
    
    // Special handling for workflows - match parent and child routes
    if (normalizedHref === "/workflows") {
      return normalizedPathname === normalizedHref || normalizedPathname.startsWith("/workflows/");
    }
    
    // Exact match for all other routes
    return normalizedPathname === normalizedHref;
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1.5 p-4">
      {navItems.map((item, index) => (
        <motion.div
          key={item.href}
          initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={shouldAnimate ? { delay: index * 0.05, duration: 0.3 } : { duration: 0 }}
        >
          <Link
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden",
              isActive(item.href)
                ? "bg-primary/15 text-primary shadow-[0_0_20px_-5px_hsl(217_100%_60%/0.3),inset_0_0_20px_hsl(217_100%_60%/0.05)] border border-primary/30"
                : "text-muted-foreground/90 hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/60"
            )}
          >
            {/* Glow effect on hover */}
            <span className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-r from-primary/5 via-primary/10 to-transparent",
              "group-hover:opacity-100"
            )} />
            
            <item.icon className={cn(
              "w-4 h-4 transition-all duration-300 relative z-10",
              isActive(item.href) && "drop-shadow-[0_0_8px_hsl(217_100%_60%/0.5)]"
            )} />
            <span className="relative z-10">{item.title}</span>
            
            {/* Active indicator line */}
            {isActive(item.href) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full shadow-[0_0_10px_hsl(217_100%_60%/0.5)]" />
            )}
          </Link>
        </motion.div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2.5 rounded-lg glass border border-border/50 hover:border-primary/30 hover:shadow-[0_0_15px_-5px_hsl(217_100%_60%/0.2)] transition-all duration-300"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 bg-background/90 backdrop-blur-xl border-r border-border/60 overflow-y-auto">
        {/* Subtle glow at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-md z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 z-40"
            >
              {/* Subtle glow at top */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="font-accent text-lg font-semibold text-gradient">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;



