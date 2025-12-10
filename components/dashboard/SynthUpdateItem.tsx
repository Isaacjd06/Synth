import { cn } from "@/lib/utils";
import { 
  Settings, 
  Bot, 
  Link2, 
  TrendingUp, 
  Brain, 
  Wrench, 
  FileText,
  LucideIcon
} from "lucide-react";

export type UpdateType = 
  | "workflow" 
  | "ai" 
  | "connection" 
  | "usage" 
  | "memory" 
  | "system" 
  | "changelog";

interface SynthUpdateItemProps {
  type: UpdateType;
  title: string;
  description: string;
  timestamp?: string;
}

const typeConfig: Record<UpdateType, { icon: LucideIcon; color: string; bgColor: string }> = {
  workflow: { icon: Settings, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  ai: { icon: Bot, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  connection: { icon: Link2, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  usage: { icon: TrendingUp, color: "text-green-400", bgColor: "bg-green-500/10" },
  memory: { icon: Brain, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  system: { icon: Wrench, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  changelog: { icon: FileText, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
};

const SynthUpdateItem = ({ type, title, description, timestamp }: SynthUpdateItemProps) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/10 transition-colors">
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
        config.bgColor,
        config.color
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        {timestamp && (
          <p className="text-xs text-muted-foreground/60 mt-2">{timestamp}</p>
        )}
      </div>
    </div>
  );
};

export default SynthUpdateItem;



