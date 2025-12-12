"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";
import { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubscriptionProvider>
          <ScrollPositionProvider>
            {children}
          </ScrollPositionProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

