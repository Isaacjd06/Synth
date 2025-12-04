"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface RunWorkflowButtonProps {
  workflowId: string;
}

export default function RunWorkflowButton({ workflowId }: RunWorkflowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRun = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

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
        throw new Error(data.error || "Failed to run workflow");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        onClick={handleRun}
        loading={loading}
        disabled={loading || success}
      >
        {success ? "✓ Executed Successfully" : "Run Workflow"}
      </Button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

