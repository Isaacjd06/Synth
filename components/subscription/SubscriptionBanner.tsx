"use client";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface SubscriptionBannerProps {
  feature?: string;
}

const SubscriptionBanner = ({ feature }: SubscriptionBannerProps) => {
  const { openSubscriptionModal } = useSubscription();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 backdrop-blur-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">
              Your Synth subscription is inactive
            </h4>
            <p className="text-sm text-muted-foreground font-light">
              {feature
                ? `Reactivate to ${feature}`
                : "Reactivate to continue running automations."}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => openSubscriptionModal(feature)}
          className="bg-primary hover:bg-primary/90 gap-2 shrink-0"
        >
          View Plans
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SubscriptionBanner;




