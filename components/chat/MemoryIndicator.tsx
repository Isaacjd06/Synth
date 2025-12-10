"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MemoryItem {
  id: string;
  type: "preference" | "context" | "history";
  content: string;
  source: string;
}

const mockMemories: MemoryItem[] = [
  { id: "1", type: "preference", content: "Prefers concise responses", source: "User Settings" },
  { id: "2", type: "context", content: "Works in SaaS industry", source: "Profile" },
  { id: "3", type: "history", content: "Previously discussed email automation", source: "Past Conversation" },
];

interface MemoryIndicatorProps {
  isActive?: boolean;
  className?: string;
}

const MemoryIndicator = ({ isActive = true, className = "" }: MemoryIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = (type: MemoryItem["type"]) => {
    switch (type) {
      case "preference": return "bg-blue-500/20 text-blue-400";
      case "context": return "bg-purple-500/20 text-purple-400";
      case "history": return "bg-green-500/20 text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isActive) return null;

  return (
    <div className={`border-b border-border bg-muted/30 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span>Memory Active</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {mockMemories.length} items
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary/60" />
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Synth is using the following context to personalize responses:
              </p>
              {mockMemories.map((memory) => (
                <div 
                  key={memory.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-background/50 border border-border"
                >
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${getTypeColor(memory.type)}`}>
                    {memory.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{memory.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">From: {memory.source}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs w-full mt-2">
                Manage Memories →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryIndicator;




