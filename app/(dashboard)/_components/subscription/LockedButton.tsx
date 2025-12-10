"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SubscriptionPlan } from "@/lib/subscription";

interface LockedButtonProps {
  children: React.ReactNode;
  reason?: string;
  requiredPlan?: SubscriptionPlan;
  onUpgradeClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export default function LockedButton({
  children,
  reason = "Subscribe to unlock this feature",
  requiredPlan,
  onUpgradeClick,
  className = "",
  variant = "outline",
  size = "default",
  asChild = false,
}: LockedButtonProps) {
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.location.href = "/app/billing";
    }
  };

  const tooltipContent = requiredPlan
    ? `${reason} (Requires ${requiredPlan} plan)`
    : reason;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={isShaking ? {
              x: [0, -10, 10, -10, 10, 0],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <Button
              disabled
              variant={variant}
              size={size}
              className={`opacity-60 cursor-not-allowed relative ${className}`}
              onClick={handleClick}
              asChild={asChild}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {children}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

