import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, AlertCircle, TrendingUp, Clock } from "lucide-react";

const topWorkflows = [
  { name: "Email Onboarding", runs: 847, successRate: "99.2%", avgDuration: "1.8s" },
  { name: "Lead Scoring", runs: 623, successRate: "97.5%", avgDuration: "3.2s" },
  { name: "Data Sync", runs: 512, successRate: "98.8%", avgDuration: "2.1s" },
  { name: "Slack Notifications", runs: 489, successRate: "100%", avgDuration: "0.9s" },
  { name: "CRM Update", runs: 234, successRate: "96.3%", avgDuration: "4.5s" },
];

const errorWorkflows = [
  { name: "API Integration", errors: 23, lastFailure: "10 min ago", severity: "recurring" },
  { name: "Data Export", errors: 12, lastFailure: "2 hours ago", severity: "new" },
  { name: "Lead Scoring", errors: 8, lastFailure: "45 min ago", severity: "recurring" },
  { name: "Webhook Handler", errors: 5, lastFailure: "6 hours ago", severity: "resolved" },
  { name: "Email Campaign", errors: 3, lastFailure: "1 day ago", severity: "resolved" },
];

const severityColors = {
  recurring: "text-red-400 bg-red-500/10 border-red-500/20",
  new: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  resolved: "text-green-400 bg-green-500/10 border-green-500/20",
};

const DashboardWorkflowRankings = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-foreground">Top Workflows</h2>
        </div>
        <div className="space-y-2 flex-1">
          {topWorkflows.map((wf, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-bold text-muted-foreground w-5">#{index + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{wf.name}</span>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {wf.runs} runs
                  </span>
                  <span>{wf.successRate} success</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {wf.avgDuration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-foreground">Workflows With Most Errors</h2>
        </div>
        <div className="space-y-2 flex-1">
          {errorWorkflows.map((wf, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-lg font-bold text-red-400">{wf.errors}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{wf.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColors[wf.severity]}`}>
                    {wf.severity}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">Last failure: {wf.lastFailure}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardWorkflowRankings;



