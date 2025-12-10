import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ExecutionEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Play className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Executions Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Run a workflow to see execution activity here. Executions will show run history, status, and details.
      </p>
      <Button asChild>
        <Link href="/app/workflows">
          Go to Workflows
        </Link>
      </Button>
    </div>
  );
};

export default ExecutionEmptyState;




