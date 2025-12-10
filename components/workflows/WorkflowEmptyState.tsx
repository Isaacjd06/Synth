import { Workflow, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const WorkflowEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Workflow className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Workflows Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Create your first automation to get started. Synth will help you build powerful workflows in minutes.
      </p>
      <Button asChild size="lg">
        <Link href="/app/workflows/create" className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Workflow
        </Link>
      </Button>
    </div>
  );
};

export default WorkflowEmptyState;




