"use client";

import { motion } from "framer-motion";
import { Lock, Check, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const categoryColors: Record<string, string> = {
  Communication: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Productivity: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Finance: "bg-green-500/20 text-green-400 border-green-500/30",
  Developer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Storage: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Design: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Social Media": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  CRM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  AI: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Marketing: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "E-commerce": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Enterprise: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const ConnectionIntegrationCard = ({ integration, isLocked, upgradeMessage, onClick, index }: ConnectionIntegrationCardProps) => {
  const { openSubscriptionModal } = useSubscription();

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSubscriptionModal(`${integration.name} integration`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 group h-full",
          "hover:scale-[1.02] hover:-translate-y-1",
          "border-border/60 bg-card/50 backdrop-blur-sm",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]",
          isLocked && "opacity-75"
        )}
      >
        {/* Connected Badge */}
        {integration.connected && !isLocked && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-xs gap-1 px-2 py-0.5">
              <Check className="w-3 h-3" />
              Connected
            </Badge>
          </div>
        )}

        {/* Connected Glow Line */}
        {integration.connected && !isLocked && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500/30 via-green-400 to-green-500/30" />
        )}

        <CardContent className="p-5 flex flex-col h-full min-h-[200px]">
          <div className="flex items-start gap-3 mb-3">
            <IntegrationIcon 
              app={integration.name} 
              size="md"
              className="group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-base">
                {integration.name}
              </h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0 mt-1 border",
                  categoryColors[integration.category] || "bg-muted/20 text-muted-foreground border-muted/30"
                )}
              >
                {integration.category}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-grow leading-relaxed">
            {integration.description}
          </p>

          {/* Action Button */}
          <div className="mt-4 pt-3 border-t border-border/30">
            {isLocked ? (
              <Button 
                size="sm"
                variant="outline"
                className="w-full border-border/50 text-muted-foreground hover:bg-muted/20 transition-all duration-300"
                onClick={handleUpgradeClick}
                disabled={false}
              >
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to {upgradeMessage.includes("Subscribe") ? "Connect" : upgradeMessage}
              </Button>
            ) : (
              <Button 
                size="sm"
                className={cn(
                  "w-full bg-primary hover:bg-primary/90 transition-all duration-300",
                  "hover:shadow-[0_0_20px_-5px_hsl(var(--primary))]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Details
              </Button>
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

