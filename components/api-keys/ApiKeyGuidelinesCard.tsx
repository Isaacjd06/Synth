import { Shield, Key, RefreshCw, AlertTriangle, Lock, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ApiKeyGuidelinesCard = () => {
  const guidelines = [
    {
      icon: Key,
      text: "Use API keys to access Synth endpoints programmatically.",
    },
    {
      icon: Lock,
      text: "Never share your API keys or expose them in client-side code.",
    },
    {
      icon: RefreshCw,
      text: "Rotate keys regularly for security best practices.",
    },
    {
      icon: AlertTriangle,
      text: "If a key is compromised, revoke it immediately.",
    },
    {
      icon: Shield,
      text: "Scoped keys restrict what actions can be performed.",
    },
  ];

  return (
    <Card className="p-5 bg-card border-border mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">How to Use API Keys</h3>
      </div>

      <ul className="space-y-3 mb-4">
        {guidelines.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>

      <Button variant="outline" size="sm" className="text-xs">
        <ExternalLink className="w-3 h-3 mr-1.5" />
        View Full API Documentation
      </Button>
    </Card>
  );
};

export default ApiKeyGuidelinesCard;



