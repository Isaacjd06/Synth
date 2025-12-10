import { Zap, Workflow, Bell, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsBarProps {
  onAction: (action: string) => void;
}

const quickActions = [
  { id: "create", label: "Create Automation", icon: Zap },
  { id: "workflows", label: "My Workflows", icon: Workflow },
  { id: "followup", label: "Optimize Follow-Ups", icon: Bell },
  { id: "summary", label: "Build Daily Summary", icon: FileText },
  { id: "reset", label: "Start Over", icon: RotateCcw },
];

const QuickActionsBar = ({ onAction }: QuickActionsBarProps) => {
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {quickActions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => onAction(action.id)}
          className="gap-1.5 text-xs border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
        >
          <action.icon className="w-3.5 h-3.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickActionsBar;



