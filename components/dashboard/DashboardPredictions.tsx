import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Clock, Gauge, Wrench } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const sparklineData = [
  { v: 120 }, { v: 180 }, { v: 200 }, { v: 220 }, { v: 280 }, { v: 320 }, { v: 380 },
];

const predictions = [
  { icon: TrendingUp, title: "Expected Executions (24h)", value: "2,150", subtext: "+16% vs today", sparkline: true },
  { icon: AlertTriangle, title: "Workflows Likely to Fail", value: "2", subtext: "Lead Scoring, Data Sync", badge: "warning" },
  { icon: Clock, title: "Peak Trigger Hours", value: "10am - 2pm", subtext: "Plan maintenance outside", badge: "info" },
  { icon: Gauge, title: "API Rate Limit Risk", value: "Medium", subtext: "Slack nearing 80% quota", badge: "warning" },
  { icon: Wrench, title: "Maintenance Needed", value: "3 workflows", subtext: "Updates recommended this week", badge: "info" },
];

const DashboardPredictions = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Predictions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1 content-start">
        {predictions.map((pred, index) => (
          <div key={index} className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <pred.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{pred.title}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">{pred.value}</p>
                {pred.badge ? (
                  <Badge variant="outline" className={`text-[10px] mt-1 ${
                    pred.badge === "warning" ? "text-yellow-400 border-yellow-500/30" : "text-blue-400 border-blue-500/30"
                  }`}>
                    {pred.subtext}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{pred.subtext}</span>
                )}
              </div>
              {pred.sparkline && (
                <div className="w-16 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardPredictions;



