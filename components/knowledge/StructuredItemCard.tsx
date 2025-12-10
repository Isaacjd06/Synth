"use client";
import { motion } from "framer-motion";
import { Eye, Pencil, Trash2, Building2, Package, User, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StructuredType = "company_info" | "product" | "team_member" | "tool";

export interface StructuredDataItem {
  id: string;
  type: StructuredType;
  name: string;
  preview: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

interface StructuredItemCardProps {
  item: StructuredDataItem;
  index: number;
  onView: (item: StructuredDataItem) => void;
  onEdit: (item: StructuredDataItem) => void;
  onDelete: (id: string) => void;
}

const typeConfig = {
  company_info: { label: "Company", icon: Building2, color: "text-blue-400", bg: "bg-blue-500/20" },
  product: { label: "Product", icon: Package, color: "text-green-400", bg: "bg-green-500/20" },
  team_member: { label: "Team Member", icon: User, color: "text-purple-400", bg: "bg-purple-500/20" },
  tool: { label: "Tool", icon: Wrench, color: "text-amber-400", bg: "bg-amber-500/20" },
};

const StructuredItemCard = ({ item, index, onView, onEdit, onDelete }: StructuredItemCardProps) => {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground text-sm truncate">{item.name}</h4>
              <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.preview}</p>
            <p className="text-xs text-muted-foreground mt-2">Updated {item.updatedAt}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(item)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StructuredItemCard;




