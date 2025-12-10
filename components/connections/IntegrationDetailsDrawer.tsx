"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ExternalLink, Check, Shield, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
import type { Integration } from "./types";
import IntegrationIcon from "./IntegrationIcon";

interface IntegrationDetailsDrawerProps {
  integration: Integration | null;
  isLocked: boolean;
  upgradeMessage: string;
  open: boolean;
  onClose: () => void;
}

const tierColors = {
  starter: "bg-muted/50 text-muted-foreground",
  pro: "bg-primary/15 text-primary",
  agency: "bg-cyan-500/15 text-cyan-400",
};

const IntegrationDetailsDrawer = ({ 
  integration, 
  isLocked, 
  upgradeMessage, 
  open, 
  onClose 
}: IntegrationDetailsDrawerProps) => {
  const { openSubscriptionModal } = useSubscription();

  const handleConnect = () => {
    if (isLocked) {
      openSubscriptionModal(`${integration?.name} integration`);
    } else {
      // TODO: Implement actual connection logic
      console.log("Connecting to", integration?.name);
    }
  };

  const handleDisconnect = () => {
    // TODO: Implement actual disconnection logic
    console.log("Disconnecting from", integration?.name);
  };

  return (
    <AnimatePresence>
      {open && integration && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card/95 backdrop-blur-xl border-l border-border/60 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/50 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <IntegrationIcon app={integration.name} size="lg" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{integration.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("capitalize", tierColors[integration.tier])}>
                        {integration.tier}
                      </Badge>
                      {integration.connected && !isLocked && (
                        <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs gap-1">
                          <Check className="w-3 h-3" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Locked State */}
              {isLocked && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Integration Locked</h3>
                      <p className="text-sm text-muted-foreground">{upgradeMessage} to access this integration</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => openSubscriptionModal(`${integration.name} integration`)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {upgradeMessage}
                  </Button>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>

              <Separator className="bg-border/50" />

              {/* Permissions */}
              {integration.permissions && integration.permissions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Required Permissions
                  </h3>
                  <ul className="space-y-2">
                    {integration.permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium text-foreground">{integration.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Version</p>
                  <p className="text-sm font-medium text-foreground">{integration.version || "v1.0"}</p>
                </div>
              </div>

              {/* Learn More Link */}
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink className="w-4 h-4" />
                Learn more about {integration.name} integration
              </a>

              <Separator className="bg-border/50" />

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isLocked && (
                  <>
                    {integration.connected ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={handleDisconnect}
                        >
                          Disconnect
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleConnect}
                        >
                          <Plug className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={handleConnect}
                      >
                        <Plug className="w-4 h-4 mr-2" />
                        Connect {integration.name}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IntegrationDetailsDrawer;

