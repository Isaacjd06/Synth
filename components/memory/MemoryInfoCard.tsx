import { Brain, Sparkles, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const MemoryInfoCard = () => {
  const infoPoints = [
    {
      icon: Sparkles,
      text: "Synth personalizes automation based on your preferences.",
    },
    {
      icon: Clock,
      text: "Memory helps Synth understand when to run routines.",
    },
    {
      icon: Zap,
      text: "It improves workflow generation accuracy.",
    },
    {
      icon: Brain,
      text: "You can edit or delete anything Synth remembers.",
    },
  ];

  return (
    <Card className="p-5 bg-primary/5 border-primary/20 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">How Synth Uses Memory</h3>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoPoints.map((point, idx) => {
          const Icon = point.icon;
          return (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>{point.text}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default MemoryInfoCard;



