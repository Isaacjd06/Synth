"use client";
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface ScrollPositionContextType {
  saveScrollPosition: (path: string, position: number) => void;
  getScrollPosition: (path: string) => number | null;
}

const ScrollPositionContext = createContext<ScrollPositionContextType | undefined>(undefined);

// In-memory store for scroll positions
const scrollPositions = new Map<string, number>();

export function ScrollPositionProvider({ children }: { children: ReactNode }) {
  const saveScrollPosition = (path: string, position: number) => {
    scrollPositions.set(path, position);
  };

  const getScrollPosition = (path: string): number | null => {
    return scrollPositions.get(path) ?? null;
  };

  return (
    <ScrollPositionContext.Provider value={{ saveScrollPosition, getScrollPosition }}>
      {children}
    </ScrollPositionContext.Provider>
  );
}

export function useScrollPosition() {
  const context = useContext(ScrollPositionContext);
  if (!context) {
    throw new Error("useScrollPosition must be used within ScrollPositionProvider");
  }
  return context;
}

// Hook to manage scroll position for a page
export function usePageScrollPosition(enabled: boolean = true) {
  const pathname = usePathname();
  const { saveScrollPosition, getScrollPosition } = useScrollPosition();
  const containerRef = useRef<HTMLElement | null>(null);
  const isRestoringRef = useRef(false);

  // Save scroll position before navigation
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (isRestoringRef.current) return;
      const element = containerRef.current || window;
      const scrollTop = element === window ? window.scrollY : (element as HTMLElement).scrollTop;
      saveScrollPosition(pathname, scrollTop);
    };

    const element = containerRef.current || window;
    element.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, enabled, saveScrollPosition]);

  // Restore scroll position on mount
  useEffect(() => {
    if (!enabled) return;

    const savedPosition = getScrollPosition(pathname);
    if (savedPosition !== null) {
      isRestoringRef.current = true;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const element = containerRef.current || window;
        if (element === window) {
          window.scrollTo({ top: savedPosition, behavior: "instant" });
        } else {
          (element as HTMLElement).scrollTop = savedPosition;
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    }
  }, [pathname, enabled, getScrollPosition]);

  return containerRef;
}

