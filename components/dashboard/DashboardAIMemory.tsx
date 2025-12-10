import { Card } from "@/components/ui/card";
import { Brain, Heart, Repeat, Layers, Sparkles } from "lucide-react";

const memoryInsights = [
  { icon: Heart, label: "Preferences Learned", items: ["Prefers email over Slack for alerts", "Uses HubSpot as primary CRM", "Timezone: EST"] },
  { icon: Repeat, label: "Your Habits", items: ["Creates workflows on Monday mornings", "Reviews errors before EOD", "Batch updates weekly"] },
  { icon: Sparkles, label: "Frequently Used", items: ["Gmail", "Slack", "Google Sheets", "PostgreSQL"] },
  { icon: Layers, label: "Common Patterns", items: ["Trigger → Filter → Action → Notify", "3-step average workflow length", "Heavy use of conditional logic"] },
];

const DashboardAIMemory = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI Memory Observations</h2>
        <span className="text-xs text-muted-foreground ml-auto">Synth is learning from your patterns</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 content-start">
        {memoryInsights.map((insight, index) => (
          <div key={index} className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <insight.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{insight.label}</span>
            </div>
            <ul className="space-y-1">
              {insight.items.map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardAIMemory;



