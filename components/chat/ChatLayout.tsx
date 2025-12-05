"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden">
      {children}
    </div>
  );
}

