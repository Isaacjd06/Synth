import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, Clock, Merge, Mail, Shield, Trash2, Link2 } from "lucide-react";

const recommendations = [
  { icon: Zap, title: "Optimize Lead Scoring", description: "Reduce execution time by 45% with suggested changes", action: "Apply" },
  { icon: Clock, title: "Add Rate Limit Delay", description: "Prevent API throttling on Slack integration", action: "Apply" },
  { icon: Merge, title: "Consolidate Workflows", description: "Merge 3 similar notification workflows into one", action: "Review" },
  { icon: Mail, title: "Improve Email Content", description: "A/B test shows shorter subject lines perform better", action: "View" },
  { icon: Shield, title: "Add Error Handling", description: "Add fallback step to Data Sync workflow", action: "Apply" },
  { icon: Trash2, title: "Remove Unused Workflow", description: "Legacy Import workflow hasn't run in 30 days", action: "Remove" },
  { icon: Link2, title: "Reconnect Stale Integration", description: "Google Sheets token expires in 2 days", action: "Reconnect" },
];

const DashboardAIRecommendations = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI Recommendations</h2>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <rec.icon className="w-4 h-4 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">{rec.title}</span>
              <p className="text-xs text-muted-foreground">{rec.description}</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs h-7 px-3">
              {rec.action}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardAIRecommendations;



