"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MemoryItem, { MemoryItemData } from "./MemoryItem";
import { cn } from "@/lib/utils";

interface MemoryCategoryCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  memories: MemoryItemData[];
  onEditMemory: (id: string, newTitle: string, newDescription: string) => void;
  onDeleteMemory: (id: string) => void;
  defaultOpen?: boolean;
}

const MemoryCategoryCard = ({
  title,
  icon,
  iconBg,
  memories,
  onEditMemory,
  onDeleteMemory,
  defaultOpen = false,
}: MemoryCategoryCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", iconBg)}>
                {icon}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  {memories.length} {memories.length === 1 ? "memory" : "memories"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {memories.length}
              </Badge>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-4 space-y-2"
              >
                {memories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No memories in this category yet.
                  </p>
                ) : (
                  memories.map((memory) => (
                    <MemoryItem
                      key={memory.id}
                      memory={memory}
                      onEdit={onEditMemory}
                      onDelete={onDeleteMemory}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MemoryCategoryCard;




