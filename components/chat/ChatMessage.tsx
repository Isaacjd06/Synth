"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronDown, ChevronUp, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type MessageType = "text" | "workflow" | "action" | "system" | "code";

export interface ChatMessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
  actions?: Array<{ label: string; onClick?: () => void }>;
  codeBlock?: { language: string; code: string };
  workflowSteps?: Array<{ step: number; title: string; description: string }>;
}

const ChatMessage = ({ 
  id, 
  role, 
  content, 
  timestamp, 
  type = "text",
  metadata,
  actions,
  codeBlock,
  workflowSteps 
}: ChatMessageProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMeta, setExpandedMeta] = useState(false);

  const handleCopy = (text: string, copyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        role === "user" && "justify-end",
        role === "system" && "justify-center"
      )}
    >
      {/* Avatar for assistant */}
      {role === "assistant" && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] lg:max-w-[70%] rounded-xl group relative",
          role === "user" && "bg-primary text-primary-foreground px-4 py-3",
          role === "assistant" && "bg-muted/50 border border-border/50 px-4 py-3",
          role === "system" && "bg-card/30 text-muted-foreground border border-border/30 px-4 py-2 text-center text-sm"
        )}
      >
        {/* Main content */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>

        {/* Workflow steps */}
        {workflowSteps && workflowSteps.length > 0 && (
          <div className="mt-4 space-y-2">
            {workflowSteps.map((step) => (
              <div 
                key={step.step}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                  {step.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Code block */}
        {codeBlock && (
          <div className="mt-3 rounded-lg bg-background/80 border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30">
              <span className="text-xs text-muted-foreground font-mono">{codeBlock.language}</span>
              <button
                onClick={() => handleCopy(codeBlock.code, `code-${id}`)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                {copiedId === `code-${id}` ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono overflow-x-auto text-foreground/90">
              {codeBlock.code}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="text-xs h-8 bg-background/50 hover:bg-primary/10 hover:border-primary/50"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "text-[10px] mt-2 flex items-center gap-2",
          role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
        )}>
          <span>{timestamp}</span>
        </div>

        {/* Copy button */}
        {role !== "system" && (
          <button
            onClick={() => handleCopy(content, id)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background/30"
          >
            {copiedId === id ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Metadata expand */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <button
              onClick={() => setExpandedMeta(!expandedMeta)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedMeta ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              View metadata
            </button>
            {expandedMeta && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-2 text-[10px] bg-background/30 p-2 rounded-md overflow-x-auto font-mono"
              >
                {JSON.stringify(metadata, null, 2)}
              </motion.pre>
            )}
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {role === "user" && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;




