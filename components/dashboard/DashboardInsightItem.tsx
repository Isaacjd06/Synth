"use client";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardInsightItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isNew?: boolean;
}

const DashboardInsightItem = ({ icon: Icon, title, description, isNew }: DashboardInsightItemProps) => {
  return (
    <div className="p-4 rounded-xl bg-synth-surface-light/40 border border-border/30 hover:border-border/50 transition-colors group">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">
              {title}
            </h4>
            {isNew && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardInsightItem;

