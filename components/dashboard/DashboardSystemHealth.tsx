import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Gauge, Clock, Activity, AlertTriangle } from "lucide-react";

const healthMetrics = [
  { icon: Gauge, label: "Engine Response Time", value: "124ms", status: "healthy", threshold: "< 200ms" },
  { icon: Clock, label: "Avg Processing Speed", value: "2.3s", status: "healthy", threshold: "< 5s" },
  { icon: Activity, label: "External Service Latency", value: "340ms", status: "warning", threshold: "< 300ms" },
  { icon: Server, label: "Automation Load", value: "Moderate", status: "healthy", threshold: "67% capacity" },
];

const slowWorkflows = [
  { name: "Lead Scoring", duration: "8.2s", warning: "3x slower than average" },
  { name: "Data Export", duration: "12.4s", warning: "Timeout risk" },
];

const statusColors = {
  healthy: "text-green-400 bg-green-500/10 border-green-500/20",
  warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
};

const DashboardSystemHealth = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">System Health</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">{metric.value}</span>
              <Badge variant="outline" className={`text-[10px] ${statusColors[metric.status]}`}>
                {metric.status}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground">{metric.threshold}</span>
          </div>
        ))}
      </div>
      <div className="flex-1">
        {slowWorkflows.length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">Slow Workflows</span>
            </div>
            <div className="space-y-2">
              {slowWorkflows.map((wf, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-yellow-500/5 border border-yellow-500/20">
                  <span className="text-sm text-foreground">{wf.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-400">{wf.duration}</span>
                    <span className="text-xs text-muted-foreground">{wf.warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DashboardSystemHealth;



