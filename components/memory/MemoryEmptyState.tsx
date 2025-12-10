import { Brain, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const MemoryEmptyState = () => {
  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-primary/10 relative">
          <Brain className="w-8 h-8 text-primary" />
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-primary/20">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Memory Yet
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        As you use Synth, AI memory entries will appear here.
      </p>
      <p className="text-muted-foreground/70 text-xs max-w-xs mx-auto">
        Start using workflows or chat with Synth to build memory.
      </p>
    </Card>
  );
};

export default MemoryEmptyState;



