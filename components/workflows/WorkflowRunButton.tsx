"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

interface WorkflowRunButtonProps {
  workflowId: string;
  n8nWorkflowId: string | null;
}

export default function WorkflowRunButton({ workflowId, n8nWorkflowId }: WorkflowRunButtonProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunWorkflow = async () => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Workflow executed successfully", {
          description: `Execution ID: ${data.execution?.id || "N/A"}`,
        });
        // Trigger a refresh of the executions list (parent component will handle this)
        window.dispatchEvent(new CustomEvent("workflow-executed"));
      } else {
        toast.error("Failed to run workflow", {
          description: data.error || "Unknown error occurred",
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error running workflow:", err);
      toast.error("Failed to run workflow", {
        description: err.message || "Network error occurred",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleRunWorkflow}
      disabled={isRunning || !n8nWorkflowId}
      className="gap-2"
    >
      {isRunning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Run Workflow
        </>
      )}
    </Button>
  );
}

