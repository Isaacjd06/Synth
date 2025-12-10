"use client";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RulePriority = "low" | "medium" | "high";

export interface BusinessRule {
  id: string;
  content: string;
  priority: RulePriority;
  updatedAt: string;
}

interface BusinessRuleCardProps {
  rule: BusinessRule;
  index: number;
  onEdit: (rule: BusinessRule) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  high: { label: "High", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const BusinessRuleCard = ({ rule, index, onEdit, onDelete }: BusinessRuleCardProps) => {
  const config = priorityConfig[rule.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card className={cn(
        "p-4 bg-card border-border hover:border-border/80 transition-all",
        rule.priority === "high" && "border-l-2 border-l-red-500"
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs", config.className)}>
                {config.label} Priority
              </Badge>
            </div>
            <p className="text-sm text-foreground">{rule.content}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Updated {rule.updatedAt}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(rule)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default BusinessRuleCard;




