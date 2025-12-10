import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, XCircle, Zap, Database, Mail, AlertTriangle, Globe } from "lucide-react";

const activities = [
  { icon: CheckCircle, workflow: "Email Onboarding", action: "Workflow completed successfully", time: "2 min ago", status: "success" },
  { icon: Mail, workflow: "Lead Nurture", action: "Email sent to john@example.com", time: "5 min ago", status: "success" },
  { icon: Database, workflow: "Data Sync", action: "847 records synchronized", time: "8 min ago", status: "success" },
  { icon: XCircle, workflow: "API Integration", action: "Failed: Connection timeout", time: "12 min ago", status: "error" },
  { icon: Zap, workflow: "Webhook Handler", action: "Trigger fired from Stripe", time: "15 min ago", status: "info" },
  { icon: CheckCircle, workflow: "CRM Update", action: "Contact updated in HubSpot", time: "18 min ago", status: "success" },
  { icon: AlertTriangle, workflow: "Rate Limiter", action: "Warning: Approaching API limit", time: "22 min ago", status: "warning" },
  { icon: Globe, workflow: "HTTP Request", action: "POST /api/webhook returned 200", time: "25 min ago", status: "success" },
  { icon: CheckCircle, workflow: "Slack Notifications", action: "Message sent to #alerts", time: "28 min ago", status: "success" },
  { icon: XCircle, workflow: "Data Export", action: "Failed: Invalid credentials", time: "35 min ago", status: "error" },
];

const statusColors = {
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

const DashboardActivityFeed = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
      </div>
      <ScrollArea className="flex-1 min-h-[300px]">
        <div className="space-y-2 pr-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <activity.icon className={`w-4 h-4 mt-0.5 ${statusColors[activity.status]}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{activity.workflow}</span>
                <p className="text-xs text-muted-foreground">{activity.action}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DashboardActivityFeed;



