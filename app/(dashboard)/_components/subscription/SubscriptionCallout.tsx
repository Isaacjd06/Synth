"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionCalloutProps {
  title?: string;
  subtitle?: string;
  onUpgradeClick?: () => void;
}

export default function SubscriptionCallout({
  title = "Subscription Required",
  subtitle = "Upgrade to unlock workflows, executions, and integrations. Get full access to Synth's automation platform.",
  onUpgradeClick,
}: SubscriptionCalloutProps) {
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default: navigate to billing page
      window.location.href = "/app/billing";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{subtitle}</p>
          <Button onClick={handleUpgrade} className="bg-primary hover:bg-primary/90 gap-2">
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

