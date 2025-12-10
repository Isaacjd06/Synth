"use client";

import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
import type { Integration } from "./types";
import IntegrationIcon from "./IntegrationIcon";

interface ConnectionIntegrationCardProps {
  integration: Integration;
  isLocked: boolean;
  upgradeMessage: string;
  onClick: () => void;
  index: number;
}

const tierColors = {
  starter: "bg-muted/50 text-muted-foreground border-muted",
  pro: "bg-primary/15 text-primary border-primary/30",
  agency: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const ConnectionIntegrationCard = ({ integration, isLocked, upgradeMessage, onClick, index }: ConnectionIntegrationCardProps) => {
  const { openSubscriptionModal } = useSubscription();

  const handleClick = () => {
    if (integration.comingSoon) return;
    if (isLocked) {
      openSubscriptionModal(`${integration.name} integration`);
    } else {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300 group h-full",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
          "border-border/60 bg-card/50 backdrop-blur-sm",
          isLocked && "opacity-60",
          integration.comingSoon && "opacity-50 cursor-default"
        )}
      >
        {/* Coming Soon Badge */}
        {integration.comingSoon && (
          <div className="absolute top-0 right-0 z-20">
            <Badge className="rounded-none rounded-bl-lg bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              Coming Soon
            </Badge>
          </div>
        )}

        {/* Lock Overlay */}
        {isLocked && !integration.comingSoon && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-muted/80 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">{upgradeMessage}</p>
            </div>
          </div>
        )}

        {/* Connected Indicator Glow */}
        {integration.connected && !isLocked && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/50 via-green-400 to-green-500/50" />
        )}

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <IntegrationIcon 
                app={integration.name} 
                size="md"
                className="group-hover:border-primary/30 transition-colors duration-300"
              />
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {integration.name}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0 capitalize", tierColors[integration.tier])}
                >
                  {integration.tier}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {integration.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">{integration.category}</span>
            
            {integration.connected && !isLocked && (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs gap-1">
                <Check className="w-3 h-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardContent>

        {/* Hover Glow Effect */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          "bg-gradient-to-t from-primary/5 via-transparent to-transparent"
        )} />
      </Card>
    </motion.div>
  );
};

export default ConnectionIntegrationCard;

