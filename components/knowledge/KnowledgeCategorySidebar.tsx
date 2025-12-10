import { ListChecks, Shield, BookOpen, Layers, FileCode, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeCategory } from "./KnowledgeCategoryBadge";

interface CategoryItem {
  id: KnowledgeCategory | "all";
  label: string;
  icon: React.ElementType;
  count: number;
}

interface KnowledgeCategorySidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
}

const KnowledgeCategorySidebar = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: KnowledgeCategorySidebarProps) => {
  const categories: CategoryItem[] = [
    { id: "all", label: "All Entries", icon: FileText, count: categoryCounts.all || 0 },
    { id: "sop", label: "SOPs", icon: ListChecks, count: categoryCounts.sop || 0 },
    { id: "rule", label: "Business Rules", icon: Shield, count: categoryCounts.rule || 0 },
    { id: "definition", label: "Definitions", icon: BookOpen, count: categoryCounts.definition || 0 },
    { id: "process", label: "Processes", icon: Layers, count: categoryCounts.process || 0 },
    { id: "template", label: "Templates", icon: FileCode, count: categoryCounts.template || 0 },
    { id: "general", label: "General Knowledge", icon: FileText, count: categoryCounts.general || 0 },
  ];

  return (
    <div className="hidden lg:block w-56 shrink-0">
      <h3 className="text-sm font-medium text-foreground mb-3">Categories</h3>
      <nav className="space-y-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </div>
              {cat.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  isActive ? "bg-primary/30" : "bg-muted"
                )}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default KnowledgeCategorySidebar;



