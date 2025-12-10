"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedOverlayProps {
  children: React.ReactNode;
  message?: string;
  onUpgradeClick?: () => void;
  requiredPlan?: string;
}

export default function LockedOverlay({
  children,
  message = "This feature is available on paid plans.",
  onUpgradeClick,
  requiredPlan,
}: LockedOverlayProps) {
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.location.href = "/app/billing";
    }
  };

  const fullMessage = requiredPlan
    ? `${message} Upgrade to ${requiredPlan} to unlock.`
    : message;

  return (
    <div className="relative">
      {/* Dimmed content */}
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Feature Locked
          </h3>
          <p className="text-muted-foreground mb-6">{fullMessage}</p>
          <Button onClick={handleUpgrade} className="bg-primary hover:bg-primary/90 gap-2">
            Upgrade to Unlock
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

