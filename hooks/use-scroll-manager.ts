"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  saveScrollPosition,
  applyScrollPosition,
  shouldManageScroll,
} from "@/lib/scroll-manager";

/**
 * Hook to manage scroll position across dashboard page navigation
 * 
 * Usage: Add this hook to dashboard pages (not chat page)
 */
export function useScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldManageScroll(pathname)) {
      return;
    }

    // Save scroll position when component unmounts or pathname changes
    const handleBeforeUnload = () => {
      saveScrollPosition(pathname);
    };

    // Save scroll position on scroll (throttled)
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        saveScrollPosition(pathname);
      }, 150); // Throttle scroll saves
    };

    // Apply saved scroll position on mount
    applyScrollPosition(pathname, 150);

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      // Save position one last time before unmount
      saveScrollPosition(pathname);
    };
  }, [pathname]);
}

