"use client";

import { motion } from "framer-motion";
import { Check, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Integration } from "@/components/connections/types";
import IntegrationIcon from "./IntegrationIcon";

interface ConnectionIntegrationCardSubscribedProps {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  index: number;
}

const ConnectionIntegrationCardSubscribed = ({ 
  integration, 
  onConnect, 
  onDisconnect, 
  index 
}: ConnectionIntegrationCardSubscribedProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 group h-full",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
          "border-border/60 bg-card/50 backdrop-blur-sm",
          integration.connected && "border-green-500/30",
          integration.comingSoon && "opacity-50"
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

        {/* Connected Indicator Glow */}
        {integration.connected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/50 via-green-400 to-green-500/50" />
        )}

        <CardContent className="p-4 flex flex-col h-full min-h-[180px]">
          <div className="flex items-start gap-3 mb-3">
            <IntegrationIcon 
              app={integration.name} 
              size="md"
              className="group-hover:border-primary/30 transition-colors duration-300 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {integration.name}
              </h3>
              <span className="text-xs text-muted-foreground/70">{integration.category}</span>
            </div>
            {integration.connected && (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs gap-1 flex-shrink-0">
                <Check className="w-3 h-3" />
                Connected
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
            {integration.description}
          </p>

          {/* Action Button - Fixed at bottom */}
          <div className="mt-4 pt-2">
            {integration.comingSoon ? (
              <div className="h-9" />
            ) : integration.connected ? (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect();
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button 
                size="sm"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect();
                }}
              >
                <Plug className="w-4 h-4 mr-2" />
                Connect
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

export default ConnectionIntegrationCardSubscribed;

