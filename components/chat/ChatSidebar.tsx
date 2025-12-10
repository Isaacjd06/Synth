import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Workflow, 
  Play, 
  Brain, 
  Sparkles, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

// Placeholder data
const recentWorkflows = [
  { id: "1", name: "Lead Intake → CRM", status: "active" as const },
  { id: "2", name: "Stripe Payment Notifier", status: "active" as const },
  { id: "3", name: "Weekly Report Generator", status: "draft" as const },
];

const recentExecutions = [
  { id: "1", workflowName: "Lead Intake → CRM", status: "success" as const, time: "2 min ago", trigger: "Webhook" },
  { id: "2", workflowName: "Stripe Payment Notifier", status: "success" as const, time: "15 min ago", trigger: "Event" },
  { id: "3", workflowName: "Email Parser", status: "error" as const, time: "1 hour ago", trigger: "Scheduled" },
];

const memoryInsights = [
  "Prefers JSON summaries",
  "Frequently schedules tasks for mornings",
  "Default CRM: HubSpot",
  "Prefers Slack over email notifications",
];

const suggestedActions = [
  { label: "Generate a new workflow", icon: Sparkles },
  { label: "Review workflow changes", icon: RefreshCw },
  { label: "Reconnect integrations", icon: Zap },
  { label: "View Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
];

const ChatSidebar = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Recent Workflows */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Workflow className="w-4 h-4 text-primary" />
              Recent Workflows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{workflow.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      workflow.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/30 text-[10px]"
                        : workflow.status === "draft"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px]"
                        : "bg-red-500/10 text-red-400 border-red-500/30 text-[10px]"
                    }
                  >
                    {workflow.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Execution Activity */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              Execution Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentExecutions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                {execution.status === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{execution.workflowName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {execution.time}
                    </span>
                    <span className="text-[10px] text-muted-foreground">• {execution.trigger}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Memory Insights */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-pink-400" />
              Memory Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {memoryInsights.map((insight, idx) => (
                <li
                  key={idx}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Suggested Actions */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Suggested Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedActions.map((action, idx) => {
              const Icon = action.icon;
              const content = (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-border/30">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">{action.label}</span>
                </div>
              );

              if (action.href) {
                return (
                  <Link key={idx} to={action.href}>
                    {content}
                  </Link>
                );
              }

              return <div key={idx}>{content}</div>;
            })}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default ChatSidebar;




