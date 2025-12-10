import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Link, File, Code, AlignLeft } from "lucide-react";

export type GeneralKnowledgeType = "text" | "markdown" | "url" | "file" | "structured_doc";

interface KnowledgeTypeBadgeProps {
  type: GeneralKnowledgeType;
  className?: string;
}

const typeConfig: Record<GeneralKnowledgeType, { label: string; icon: React.ElementType; className: string }> = {
  text: {
    label: "Text",
    icon: AlignLeft,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  markdown: {
    label: "Markdown",
    icon: Code,
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  url: {
    label: "URL",
    icon: Link,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  file: {
    label: "File",
    icon: File,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  structured_doc: {
    label: "Document",
    icon: FileText,
    className: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
};

export const getTypeConfig = (type: GeneralKnowledgeType) => typeConfig[type];

const KnowledgeTypeBadge = ({ type, className }: KnowledgeTypeBadgeProps) => {
  const config = typeConfig[type];
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

export default KnowledgeTypeBadge;



