"use client";
import { ReactNode, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/app/Header";
import Sidebar from "@/components/app/Sidebar";
import { useScrollPosition } from "@/contexts/ScrollPositionContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const { saveScrollPosition, getScrollPosition } = useScrollPosition();
  const isRestoringRef = useRef(false);
  const isChatPage = pathname === "/app/chat" || pathname === "/chat";

  // Save scroll position before navigation (skip for chat page)
  useEffect(() => {
    if (isChatPage) return;

    const handleScroll = () => {
      if (isRestoringRef.current || !mainRef.current) return;
      const scrollTop = mainRef.current.scrollTop;
      saveScrollPosition(pathname, scrollTop);
    };

    const element = mainRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, [pathname, isChatPage, saveScrollPosition]);

  // Restore scroll position on mount (skip for chat page)
  useEffect(() => {
    if (isChatPage || !mainRef.current) return;

    const savedPosition = getScrollPosition(pathname);
    if (savedPosition !== null) {
      isRestoringRef.current = true;
      
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = savedPosition;
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        }
      });
    }
  }, [pathname, isChatPage, getScrollPosition]);

  return (
    <>
      <Header />
      <Sidebar />
      <main 
        ref={mainRef}
        className="lg:ml-60 mt-16 min-h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-240px)] overflow-x-hidden overflow-y-auto"
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </>
  );
}

