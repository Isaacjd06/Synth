"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/app/PageTransition";
import ExecutionHeader from "@/components/execution-detail/ExecutionHeader";
import SummaryCards from "@/components/execution-detail/SummaryCards";
import ExecutionTimelineNew from "@/components/execution-detail/ExecutionTimelineNew";
import ErrorPanel from "@/components/execution-detail/ErrorPanel";
import { synthToast } from "@/lib/synth-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Loader2 } from "lucide-react";
import type { ExecutionDetail } from "@/types/api";

export default function ExecutionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isSubscribed, requireSubscription } = useSubscription();
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const fetchExecution = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/executions/${id}`);
        if (response.ok) {
          const data = await response.json();
          setExecution(data);
        } else {
          const errorData = await response.json();
          synthToast.error("Failed to load execution", errorData.error || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching execution:", error);
        synthToast.error("Error", "Failed to load execution");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExecution();
    }
  }, [id]);

  const handleRunAgain = async () => {
    if (!requireSubscription("retry executions")) return;
    if (!execution) return;

    setIsRetrying(true);
    try {
      const response = await fetch(`/api/executions/${id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.ok && data.data) {
        synthToast.success("Execution Retried", "Workflow is now running again.");
        // Navigate to the new execution or refresh
        if (data.data.executionId) {
          router.push(`/app/executions/${data.data.executionId}`);
        } else {
          // Refresh current execution
          const refreshResponse = await fetch(`/api/executions/${id}`);
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setExecution(refreshData);
          }
        }
      } else {
        synthToast.error("Retry Failed", data.error || "Failed to retry execution");
      }
    } catch (error) {
      synthToast.error("Error", "Failed to retry execution");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFixInChat = () => {
    if (!execution?.error) return;
    router.push(`/app/chat?prefill=${encodeURIComponent(`Help me fix this workflow error: ${execution.error.message}`)}`);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-synth-navy-light/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!execution) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-synth-navy-light/20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Execution not found</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Map execution data to component format
  const formatDuration = (ms: number | null) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  // Map steps from execution to component format
  const mappedSteps = execution.steps.map((step, index) => ({
    id: `s${index + 1}`,
    name: step.stepName,
    status: step.status === "success" ? "completed" as const : step.status as "completed" | "error",
    timestamp: step.startTime ? new Date(step.startTime).toLocaleTimeString() : "",
    duration: formatDuration(step.durationMs),
    inputData: step.input || {},
    outputData: step.output || {},
    errorDetails: step.error ? {
      message: step.error.message,
      cause: step.error.cause || undefined,
    } : undefined,
  }));

  // Get workflow info from execution
  const workflowInfo = (execution as any).workflowName 
    ? { id: (execution as any).workflowId || execution.id, name: (execution as any).workflowName }
    : { id: execution.id, name: "Workflow" };
  
  const executionDisplay = {
    id: execution.id,
    shortId: `#${execution.id.slice(0, 8)}`,
    workflowId: workflowInfo.id,
    workflowName: workflowInfo.name,
    status: execution.status as "error" | "success" | "running",
    timestamp: formatTimeAgo(execution.createdAt),
    duration: formatDuration(execution.durationMs),
    triggerType: execution.triggerType || "Manual",
    workflowVersion: execution.workflowVersion || "v1.0.0",
    error: execution.error ? {
      message: execution.error.message,
      code: "EXECUTION_ERROR",
      possibleCause: execution.error.cause || undefined,
      stack: execution.error.stack || undefined,
    } : undefined,
    steps: mappedSteps,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-synth-navy-light/20">
      <PageTransition className="max-w-7xl mx-auto">
          <div className="space-y-6">
          {/* Header with Sticky Back Buttons */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ExecutionHeader
              workflowName={executionDisplay.workflowName}
              workflowId={executionDisplay.workflowId}
              executionId={executionDisplay.shortId}
              isSubscribed={isSubscribed}
              onRunAgain={handleRunAgain}
            />
          </motion.div>

          {/* Summary Cards with Tooltips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SummaryCards
              status={executionDisplay.status}
              executionTime={executionDisplay.duration}
              triggerType={executionDisplay.triggerType}
              workflowVersion={executionDisplay.workflowVersion}
            />
          </motion.div>

          {/* Interactive Execution Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ExecutionTimelineNew 
              steps={executionDisplay.steps} 
              isSubscribed={isSubscribed}
            />
          </motion.div>

          {/* Error Panel (only if error) */}
          {executionDisplay.status === "error" && executionDisplay.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <ErrorPanel
                errorMessage={executionDisplay.error.message}
                errorCode={executionDisplay.error.code}
                possibleCause={executionDisplay.error.possibleCause}
                stackTrace={executionDisplay.error.stack}
                onFixInChat={handleFixInChat}
                isSubscribed={isSubscribed}
              />
            </motion.div>
          )}
          </div>
        </PageTransition>
      </div>
  );
}
