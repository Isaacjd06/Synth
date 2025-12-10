"use client";
import { motion } from "framer-motion";
import { Eye, Pencil, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import KnowledgeCategoryBadge, { KnowledgeCategory } from "./KnowledgeCategoryBadge";

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  preview: string;
  lastUpdated: string;
  createdAt: string;
  usedByWorkflows: number;
  referencedInChat: boolean;
  tags?: string[];
}

interface KnowledgeCardProps {
  entry: KnowledgeEntry;
  index: number;
  onView: (entry: KnowledgeEntry) => void;
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
}

const KnowledgeCard = ({ entry, index, onView, onEdit, onDelete }: KnowledgeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-foreground line-clamp-1 flex-1">
            {entry.title}
          </h3>
          <KnowledgeCategoryBadge category={entry.category} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {entry.preview}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="w-3 h-3" />
          <span>Updated {entry.lastUpdated}</span>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onView(entry)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default KnowledgeCard;




