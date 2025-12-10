import { FileText, BookOpen, Shield, ListChecks, FileCode, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type KnowledgeCategory = "sop" | "rule" | "definition" | "process" | "template" | "general";

interface KnowledgeCategoryBadgeProps {
  category: KnowledgeCategory;
  className?: string;
}

const categoryConfig: Record<KnowledgeCategory, { label: string; icon: React.ElementType; className: string }> = {
  sop: {
    label: "SOP",
    icon: ListChecks,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  rule: {
    label: "Rule",
    icon: Shield,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  definition: {
    label: "Definition",
    icon: BookOpen,
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  process: {
    label: "Process",
    icon: Layers,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  template: {
    label: "Template",
    icon: FileCode,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  general: {
    label: "General",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const getCategoryConfig = (category: KnowledgeCategory) => categoryConfig[category];

const KnowledgeCategoryBadge = ({ category, className }: KnowledgeCategoryBadgeProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium flex items-center gap-1",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default KnowledgeCategoryBadge;



