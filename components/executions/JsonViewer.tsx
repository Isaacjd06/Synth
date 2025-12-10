import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: object | null;
  title: string;
  defaultExpanded?: boolean;
}

const JsonViewer = ({ data, title, defaultExpanded = true }: JsonViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data) {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!data) {
    return (
      <div className="rounded-lg border border-border/30 bg-muted/10 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center mb-3">
            <Copy className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Data will appear here when generated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/30 bg-card/50 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/30 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="h-7 px-2 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[400px]" : "max-h-0"
        )}
      >
        <pre className="p-4 text-xs font-mono text-foreground overflow-auto max-h-[400px] scrollbar-thin">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default JsonViewer;


