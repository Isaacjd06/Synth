import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingDown, AlertTriangle, Clock, Zap, RefreshCw, XCircle, Lightbulb } from "lucide-react";

const observations = [
  { icon: TrendingDown, title: "Slowdown Detected", description: "Email Onboarding workflow is 40% slower than last week", severity: "warning" },
  { icon: AlertTriangle, title: "Failure Spike", description: "API failures increased by 15% in the last 6 hours", severity: "critical" },
  { icon: Clock, title: "Underperforming Workflow", description: "Lead Scoring runs longer than expected (avg 8.2s)", severity: "info" },
  { icon: Zap, title: "High Frequency Alert", description: "Data Sync workflow runs every 30 seconds - consider batching", severity: "warning" },
  { icon: XCircle, title: "Inactive Workflow", description: "Welcome Email workflow hasn't run in 14 days", severity: "info" },
  { icon: RefreshCw, title: "Recurring API Issue", description: "Slack API returning 429 errors repeatedly", severity: "critical" },
  { icon: Lightbulb, title: "Optimization Opportunity", description: "3 workflows share similar logic - consider consolidating", severity: "info" },
  { icon: Brain, title: "Pattern Detected", description: "Most failures occur between 2-4 PM UTC", severity: "warning" },
];

const severityColors = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const DashboardAIObservations = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI Insights & Observations</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {observations.map((obs, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <obs.icon className={`w-4 h-4 mt-0.5 ${
              obs.severity === "critical" ? "text-red-400" :
              obs.severity === "warning" ? "text-yellow-400" : "text-blue-400"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{obs.title}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColors[obs.severity]}`}>
                  {obs.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{obs.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardAIObservations;



