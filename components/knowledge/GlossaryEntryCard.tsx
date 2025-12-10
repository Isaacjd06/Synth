"use client";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  updatedAt: string;
}

interface GlossaryEntryCardProps {
  entry: GlossaryEntry;
  index: number;
  onEdit: (entry: GlossaryEntry) => void;
  onDelete: (id: string) => void;
}

const GlossaryEntryCard = ({ entry, index, onEdit, onDelete }: GlossaryEntryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card className="p-4 bg-card border-border hover:border-border/80 transition-all">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm mb-1">{entry.term}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{entry.definition}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Updated {entry.updatedAt}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default GlossaryEntryCard;




