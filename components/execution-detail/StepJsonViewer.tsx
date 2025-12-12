"use client";
import { useState } from "react";
import { Copy, Check, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StepJsonViewerProps {
  title: string;
  data: Record<string, unknown>;
  isSubscribed?: boolean;
}

const StepJsonViewer = ({ title, data, isSubscribed = true }: StepJsonViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSubscribed) return;
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syntaxHighlight = (line: string) => {
    return line
      .replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/: (null)/g, ': <span class="text-red-400">$1</span>');
  };

  return (
    <div className="rounded-lg bg-[#0a0a0a] border border-border/40 overflow-hidden shadow-[inset_0_1px_0_0_hsl(217_50%_20%/0.1)]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                disabled={!isSubscribed}
              >
                {!isSubscribed ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                ) : copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!isSubscribed ? "Subscription required" : copied ? "Copied!" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30">
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto scrollbar-thin">
                <code>
                  {jsonString.split('\n').map((line, i) => (
                    <div key={i} className="hover:bg-muted/10 px-1 -mx-1 leading-relaxed">
                      <span className="text-muted-foreground/40 select-none mr-4 inline-block w-5 text-right">
                        {i + 1}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepJsonViewer;

