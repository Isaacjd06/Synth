"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";

const DashboardWarningBanner = () => {
  const { openSubscriptionModal } = useSubscription();

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/30 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              You are not subscribed
            </h3>
            <p className="text-sm text-muted-foreground font-light mt-0.5">
              Subscribe to activate workflows, runs, integrations, and more
            </p>
          </div>
        </div>
        <Button 
          className="bg-amber-500 hover:bg-amber-500/90 text-background font-medium shrink-0"
          onClick={() => openSubscriptionModal()}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default DashboardWarningBanner;

