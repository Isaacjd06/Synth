import { Card } from "@/components/ui/card";
import { User, Edit, Eye, Clock, FileQuestion } from "lucide-react";

const behaviorInsights = [
  { icon: Edit, label: "Most Edited", workflows: ["Email Onboarding", "Lead Scoring", "Data Sync"] },
  { icon: Eye, label: "Most Viewed", workflows: ["Dashboard Overview", "Slack Notifications", "CRM Update"] },
  { icon: Clock, label: "Peak Activity", value: "Tuesdays 10am - 12pm" },
  { icon: FileQuestion, label: "Idle Workflows", workflows: ["Legacy Import", "Test Workflow", "Backup Sync"] },
];

const recentlyUpdated = [
  { name: "Email Onboarding", updated: "2 hours ago" },
  { name: "Lead Scoring", updated: "Yesterday" },
  { name: "Data Sync", updated: "3 days ago" },
];

const DashboardUserBehavior = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Your Usage Patterns</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div className="space-y-3">
          {behaviorInsights.map((insight, index) => (
            <div key={index} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <insight.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{insight.label}</span>
              </div>
              {insight.workflows ? (
                <div className="flex flex-wrap gap-1">
                  {insight.workflows.map((wf, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{wf}</span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-primary">{insight.value}</span>
              )}
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-muted/30 h-fit">
          <span className="text-sm font-medium text-foreground">Recently Updated</span>
          <div className="mt-2 space-y-2">
            {recentlyUpdated.map((wf, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{wf.name}</span>
                <span className="text-xs text-muted-foreground">{wf.updated}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DashboardUserBehavior;



