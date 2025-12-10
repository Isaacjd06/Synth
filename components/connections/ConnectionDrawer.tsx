import { X, Check, AlertCircle, RefreshCw, Unplug } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ConnectionStatusBadge from "./ConnectionStatusBadge";
import { Integration } from "./IntegrationCard";
import { cn } from "@/lib/utils";

interface ConnectionDrawerProps {
  integration: Integration | null;
  open: boolean;
  onClose: () => void;
  onReconnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

const featuresByIntegration: Record<string, string[]> = {
  slack: ["Sending notifications", "Posting updates to channels", "Receiving messages"],
  gmail: ["Sending emails", "Reading inbox", "Creating drafts"],
  "google-sheets": ["Reading rows", "Appending data", "Creating spreadsheets"],
  notion: ["Creating pages", "Updating databases", "Reading content"],
  stripe: ["Processing payments", "Managing subscriptions", "Viewing invoices"],
  hubspot: ["Managing contacts", "Creating deals", "Tracking activities"],
  airtable: ["Reading records", "Creating entries", "Updating fields"],
  webhooks: ["Receiving external events", "Triggering workflows", "Custom integrations"],
};

const ConnectionDrawer = ({
  integration,
  open,
  onClose,
  onReconnect,
  onDisconnect,
}: ConnectionDrawerProps) => {
  if (!integration) return null;

  const Icon = integration.icon;
  const features = featuresByIntegration[integration.id] || ["General automation tasks"];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-lg", integration.iconBg)}>
                <Icon className={cn("w-6 h-6", integration.iconColor)} />
              </div>
              <div>
                <SheetTitle className="text-foreground">{integration.name}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {integration.description}
                </p>
              </div>
            </div>
          </div>
          <ConnectionStatusBadge status={integration.status} />
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Overview Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connected since</span>
                <span className="text-foreground">
                  {integration.lastConnected || "Not connected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last used</span>
                <span className="text-foreground">
                  {integration.lastUsed || "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {integration.category}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Connected Features */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              Connected Features
            </h4>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-border" />

          {/* Connection Health */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              Connection Health
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-muted-foreground">Token valid</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-muted-foreground">Permissions granted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-muted-foreground">API reachable</span>
              </div>
              {integration.status === "expired" ? (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Token expired</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-muted-foreground">No recent errors</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onReconnect(integration.id)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconnect
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDisconnect(integration.id)}
            >
              <Unplug className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConnectionDrawer;



