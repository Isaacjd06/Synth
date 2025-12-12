"use client";
import Link from "next/link";
import { ArrowLeft, Play, Lock, ExternalLink, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ExecutionHeaderProps {
  workflowName: string;
  workflowId: string;
  executionId: string;
  isSubscribed?: boolean;
  onRunAgain?: () => void;
}

const ExecutionHeader = ({
  workflowName,
  workflowId,
  executionId,
  isSubscribed = true,
  onRunAgain,
}: ExecutionHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* Sticky Back Buttons */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/30 -mt-4 mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-xs"
          >
            <Link href="/app/executions">
              <ArrowLeft className="w-3.5 h-3.5" />
              Executions
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-xs"
          >
            <Link href={`/app/workflows/${workflowId}`}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left Side - Workflow & ID */}
        <div>
          <Link
            href={`/app/workflows/${workflowId}`}
            className="text-2xl lg:text-3xl font-display text-foreground hover:text-primary transition-colors flex items-center gap-2 mb-2"
          >
            {workflowName}
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">{executionId}</span>
          </div>
        </div>

        {/* Right Side - Run Again Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                onClick={onRunAgain}
                disabled={!isSubscribed}
                className={cn(
                  "gap-2",
                  !isSubscribed && "opacity-50 cursor-not-allowed"
                )}
              >
                {!isSubscribed ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Again
              </Button>
            </div>
          </TooltipTrigger>
          {!isSubscribed && (
            <TooltipContent>
              <p>This feature requires an active Synth subscription.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
};

export default ExecutionHeader;

