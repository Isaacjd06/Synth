import { HelpCircle, Shield, Key, RefreshCw, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const HelpCard = () => {
  const tips = [
    {
      icon: Shield,
      text: "Synth uses OAuth to securely connect to your apps.",
    },
    {
      icon: Key,
      text: "Your credentials are handled safely and can be revoked anytime.",
    },
    {
      icon: CheckCircle,
      text: "Workflows can only use the apps you've connected.",
    },
    {
      icon: RefreshCw,
      text: "Reconnect apps if a token expires or permissions change.",
    },
  ];

  return (
    <Card className="p-5 bg-card border-border mt-8">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h4 className="font-medium text-foreground">How Connections Work</h4>
      </div>
      <ul className="space-y-3">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 mt-0.5 text-muted-foreground/70 shrink-0" />
              <span>{tip.text}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default HelpCard;



