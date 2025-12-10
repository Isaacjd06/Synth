import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, CheckCircle, AlertTriangle, XCircle, Clock, MessageSquare, Mail, Database, Globe, FileSpreadsheet } from "lucide-react";

const integrations = [
  { icon: MessageSquare, name: "Slack", status: "healthy", lastUsed: "2 min ago", observation: "All connections stable" },
  { icon: Mail, name: "Gmail", status: "healthy", lastUsed: "15 min ago", observation: "Normal activity" },
  { icon: FileSpreadsheet, name: "Google Sheets", status: "warning", lastUsed: "1 hour ago", observation: "Token expires in 2 days" },
  { icon: Database, name: "PostgreSQL", status: "healthy", lastUsed: "5 min ago", observation: "Low latency responses" },
  { icon: Globe, name: "Webhook API", status: "error", lastUsed: "3 hours ago", observation: "Receiving 429 errors" },
  { icon: MessageSquare, name: "Discord", status: "unused", lastUsed: "14 days ago", observation: "Consider removing if not needed" },
];

const statusConfig = {
  healthy: { label: "Healthy", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle },
  warning: { label: "Needs Attention", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  error: { label: "Error", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
  unused: { label: "Unused", color: "text-muted-foreground bg-muted/50 border-border", icon: Clock },
};

const DashboardIntegrationHealth = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Connected Apps Health</h2>
      </div>
      <div className="space-y-2 flex-1">
        {integrations.map((int, index) => {
          const config = statusConfig[int.status];
          const StatusIcon = config.icon;
          return (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <int.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{int.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{int.observation}</p>
              </div>
              <span className="text-xs text-muted-foreground">{int.lastUsed}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DashboardIntegrationHealth;



