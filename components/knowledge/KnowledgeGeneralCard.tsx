"use client";
import { motion } from "framer-motion";
import { Eye, Pencil, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import KnowledgeTypeBadge, { GeneralKnowledgeType } from "./KnowledgeTypeBadge";

export interface GeneralKnowledgeItem {
  id: string;
  title: string;
  type: GeneralKnowledgeType;
  content: string;
  preview: string;
  url?: string;
  fileUrl?: string;
  updatedAt: string;
}

interface KnowledgeGeneralCardProps {
  item: GeneralKnowledgeItem;
  index: number;
  onView: (item: GeneralKnowledgeItem) => void;
  onEdit: (item: GeneralKnowledgeItem) => void;
  onDelete: (id: string) => void;
}

const KnowledgeGeneralCard = ({ item, index, onView, onEdit, onDelete }: KnowledgeGeneralCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-foreground line-clamp-1 flex-1">{item.title}</h3>
          <KnowledgeTypeBadge type={item.type} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.preview}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {item.updatedAt}</span>
          </div>

          <div className="flex items-center gap-1">
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

export default KnowledgeGeneralCard;




