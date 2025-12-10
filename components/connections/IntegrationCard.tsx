"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ConnectionStatusBadge, { ConnectionStatus } from "./ConnectionStatusBadge";
import { cn } from "@/lib/utils";

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  status: ConnectionStatus;
  lastConnected?: string;
  lastUsed?: string;
  category: "communication" | "storage" | "crm" | "payments" | "other";
}

interface IntegrationCardProps {
  integration: Integration;
  index: number;
  onConnect: (id: string) => void;
  onManage: (integration: Integration) => void;
  isConnecting?: boolean;
}

const IntegrationCard = ({
  integration,
  index,
  onConnect,
  onManage,
  isConnecting,
}: IntegrationCardProps) => {
  const Icon = integration.icon;

  const getButtonLabel = () => {
    if (integration.status === "connected") return "Manage";
    if (integration.status === "expired") return "Reconnect";
    return "Connect";
  };

  const handleClick = () => {
    if (integration.status === "connected") {
      onManage(integration);
    } else {
      onConnect(integration.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className={cn(
          "p-4 bg-card border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5",
          integration.status === "connected" && "border-green-500/30 bg-green-500/5",
          integration.status === "expired" && "border-red-500/30 bg-red-500/5"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2.5 rounded-lg", integration.iconBg)}>
            <Icon className={cn("w-5 h-5", integration.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium text-foreground">{integration.name}</h4>
              <ConnectionStatusBadge status={integration.status} />
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {integration.description}
            </p>
            {integration.status === "connected" && integration.lastUsed && (
              <p className="text-xs text-muted-foreground">
                Last used: {integration.lastUsed}
              </p>
            )}
            {integration.status === "expired" && (
              <p className="text-xs text-red-400">
                Token expired. Please reconnect.
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant={integration.status === "connected" ? "outline" : "default"}
            className={cn(
              "w-full",
              integration.status === "expired" && "bg-red-500 hover:bg-red-600 text-white"
            )}
            onClick={handleClick}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : getButtonLabel()}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default IntegrationCard;




