"use client";
import { useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MessageSquare, Bug, ChevronDown, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ErrorPanelProps {
  errorMessage: string;
  errorCode?: string;
  possibleCause: string;
  stackTrace?: string;
  onFixInChat?: () => void;
  isSubscribed?: boolean;
}

const StackTraceFallback = () => (
  <div className="p-4 space-y-2">
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-3 w-3/4" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

const ErrorPanel = ({
  errorMessage,
  errorCode,
  possibleCause,
  stackTrace,
  onFixInChat,
  isSubscribed = true,
}: ErrorPanelProps) => {
  const [isStackTraceExpanded, setIsStackTraceExpanded] = useState(false);

  return (
    <Card className="border-red-500/40 bg-gradient-to-b from-red-500/10 to-red-500/5 overflow-hidden shadow-[0_0_30px_-10px_hsl(0_70%_50%/0.3)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-[0_0_15px_-5px_hsl(0_70%_50%/0.5)]">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-red-400">Error Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Error Message */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-red-400/70 uppercase tracking-wider font-medium">
              Error Message
            </p>
            {errorCode && (
              <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
                {errorCode}
              </Badge>
            )}
          </div>
          <p className="text-sm text-red-300 font-medium leading-relaxed">
            {errorMessage}
          </p>
        </div>

        {/* Possible Cause */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Bug className="w-3 h-3" />
            Possible Cause
          </p>
          <p className="text-sm text-muted-foreground font-light leading-relaxed pl-4 border-l-2 border-red-500/30">
            {possibleCause}
          </p>
        </div>

        {/* Collapsible Stack Trace */}
        {stackTrace && (
          <div className="rounded-xl bg-[#0a0a0a] border border-red-500/20 overflow-hidden">
            <button
              onClick={() => setIsStackTraceExpanded(!isStackTraceExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-500/5 transition-colors"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Stack Trace
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isStackTraceExpanded && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {isStackTraceExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Suspense fallback={<StackTraceFallback />}>
                    <div className="border-t border-red-500/20">
                      <pre className="p-4 text-xs font-mono text-red-300/80 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed">
                        {stackTrace}
                      </pre>
                    </div>
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Fix in Chat Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Button
                onClick={onFixInChat}
                disabled={!isSubscribed}
                className={cn(
                  "gap-2",
                  !isSubscribed && "opacity-50 cursor-not-allowed"
                )}
              >
                {!isSubscribed ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Fix in Chat
              </Button>
            </div>
          </TooltipTrigger>
          {!isSubscribed && (
            <TooltipContent>
              <p>This feature requires an active Synth subscription.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </CardContent>
    </Card>
  );
};

export default ErrorPanel;
