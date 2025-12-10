import { Card } from "@/components/ui/card";
import { Lightbulb, Zap, Archive, Sparkles, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type AdvisoryCategory = "optimization" | "unused" | "suggestion" | "productivity" | "system";

interface AdvisoryItemProps {
  title: string;
  description: string;
  priority?: "high" | "medium" | "low";
  category?: AdvisoryCategory;
}

const categoryConfig: Record<AdvisoryCategory, { icon: typeof Lightbulb; color: string }> = {
  optimization: { icon: Zap, color: "text-yellow-400" },
  unused: { icon: Archive, color: "text-orange-400" },
  suggestion: { icon: Sparkles, color: "text-purple-400" },
  productivity: { icon: Clock, color: "text-green-400" },
  system: { icon: Settings, color: "text-blue-400" },
};

const AdvisoryItem = ({ title, description, priority = "medium", category = "optimization" }: AdvisoryItemProps) => {
  const config = categoryConfig[category] || categoryConfig.optimization;
  const Icon = config.icon;
  
  return (
    <Card className="bg-muted/10 border-border/30 p-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center",
          config.color
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            {priority === "high" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wide font-medium">
                High Priority
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
};

export default AdvisoryItem;



