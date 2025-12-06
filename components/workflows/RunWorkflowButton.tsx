"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface RunWorkflowButtonProps {
  workflowId: string;
}

export default function RunWorkflowButton({ workflowId }: RunWorkflowButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/workflows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: workflowId,
          inputData: {},
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorMessage = data.error || data.details || "Failed to run workflow";
        toast.error("Workflow Execution Failed", {
          description: errorMessage,
        });
        return;
      }

      toast.success("Workflow Executed Successfully", {
        description: "The workflow has been executed and results are being logged.",
      });

      // Refresh to show new execution
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Network Error", {
        description: error.message || "Failed to connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleRun}
      disabled={loading}
    >
      {loading ? "Running..." : "Run Workflow"}
    </Button>
  );
}

