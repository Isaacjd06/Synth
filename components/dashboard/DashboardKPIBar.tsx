import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, AlertCircle, Zap, CheckCircle } from "lucide-react";

const kpiData = [
  { title: "Active Workflows", value: "24", trend: "+3", direction: "up" },
  { title: "Executions (24h)", value: "1,847", trend: "+12%", direction: "up" },
  { title: "Executions (7d)", value: "12,439", trend: "+8%", direction: "up" },
  { title: "Success Rate", value: "98.4%", trend: "+0.3%", direction: "up" },
  { title: "Error Rate (24h)", value: "1.6%", trend: "-0.2%", direction: "down" },
  { title: "Avg Execution Time", value: "2.3s", trend: "-0.4s", direction: "down" },
  { title: "Most Active Workflow", value: "Email Onboarding", trend: "847 runs", direction: "neutral" },
  { title: "Last Error", value: "2h ago", trend: "API timeout", direction: "neutral" },
];

const DashboardKPIBar = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-stretch">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="bg-card border-border/50 p-4 hover:border-primary/30 transition-all h-full flex flex-col justify-start">
          <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
          <p className="text-xl font-bold text-foreground mt-1 truncate">{kpi.value}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            kpi.direction === "up" ? "text-green-400" : 
            kpi.direction === "down" ? "text-red-400" : "text-muted-foreground"
          }`}>
            {kpi.direction === "up" && <TrendingUp className="w-3 h-3" />}
            {kpi.direction === "down" && <TrendingDown className="w-3 h-3" />}
            <span className="truncate">{kpi.trend}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardKPIBar;



