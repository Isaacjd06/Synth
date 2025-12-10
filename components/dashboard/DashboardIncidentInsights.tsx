import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, RefreshCw, Sparkles, XCircle } from "lucide-react";

const incidents = [
  { title: "Slack API Rate Limiting", description: "Receiving 429 errors when sending messages too frequently", pattern: "Recurring", step: "Send Slack Message", api: "api.slack.com" },
  { title: "Database Connection Timeout", description: "PostgreSQL connection times out after 30 seconds on Data Sync workflow", pattern: "New", step: "Insert Record", api: "db.internal" },
  { title: "Invalid Email Format", description: "Email validation failing for some lead entries", pattern: "Resolved", step: "Send Email", api: "smtp.gmail.com" },
  { title: "Webhook Authentication Failed", description: "Stripe webhook signature verification failing intermittently", pattern: "Recurring", step: "Webhook Handler", api: "api.stripe.com" },
];

const patternColors = {
  Recurring: "text-red-400 bg-red-500/10 border-red-500/20",
  New: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Resolved: "text-green-400 bg-green-500/10 border-green-500/20",
};

const DashboardIncidentInsights = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon className="w-5 h-5 text-red-400" />
        <h2 className="text-lg font-semibold text-foreground">Error Insights & Incidents</h2>
      </div>
      <div className="space-y-3 flex-1">
        {incidents.map((incident, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-foreground">{incident.title}</span>
              </div>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${patternColors[incident.pattern]}`}>
                {incident.pattern === "Recurring" && <RefreshCw className="w-3 h-3 mr-1" />}
                {incident.pattern === "New" && <Sparkles className="w-3 h-3 mr-1" />}
                {incident.pattern}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{incident.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Step: <span className="text-foreground">{incident.step}</span></span>
              <span>API: <span className="text-foreground">{incident.api}</span></span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardIncidentInsights;



