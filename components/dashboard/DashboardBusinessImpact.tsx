import { Card } from "@/components/ui/card";
import { BarChart3, Mail, MessageSquare, Users, Database, Bell, CheckCircle } from "lucide-react";

const impactMetrics = [
  { icon: Mail, label: "Emails Sent", value: "4,328", color: "text-blue-400" },
  { icon: MessageSquare, label: "Slack Messages", value: "1,892", color: "text-purple-400" },
  { icon: Users, label: "CRM Contacts Created", value: "567", color: "text-green-400" },
  { icon: Database, label: "Records Added", value: "12,439", color: "text-yellow-400" },
  { icon: Bell, label: "Notifications Sent", value: "8,234", color: "text-orange-400" },
  { icon: CheckCircle, label: "Tasks Automated", value: "23,847", color: "text-primary" },
];

const DashboardBusinessImpact = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Business Impact</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-1 content-start">
        {impactMetrics.map((metric, index) => (
          <div key={index} className="text-center p-3 rounded-lg bg-muted/30">
            <metric.icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
            <p className="text-xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardBusinessImpact;



