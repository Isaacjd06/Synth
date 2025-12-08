import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sparkles, Workflow, Zap, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/50">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="mb-4 rounded-full bg-gray-800 p-4">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6 max-w-md">{description}</p>
        {action && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={action.href}>
              <Button variant={action.variant || "default"} className="gap-2">
                {action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {secondaryAction && (
              <Link href={secondaryAction.href}>
                <Button variant="outline">{secondaryAction.label}</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyWorkflowsState() {
  return (
    <EmptyState
      icon={<Workflow className="w-8 h-8 text-[#194c92]" />}
      title="No workflows yet"
      description="Create your first workflow to automate tasks and save time. Use our AI chat to describe what you want to automate, and we'll build it for you."
      action={{
        label: "Create Your First Workflow",
        href: "/chat",
        variant: "default",
      }}
      secondaryAction={{
        label: "Learn More",
        href: "/",
      }}
    />
  );
}

export function EmptyExecutionsState() {
  return (
    <EmptyState
      icon={<Zap className="w-8 h-8 text-[#194c92]" />}
      title="No executions yet"
      description="Once you create and run workflows, their execution history will appear here. This helps you track performance and debug issues."
      action={{
        label: "Create a Workflow",
        href: "/chat",
        variant: "default",
      }}
      secondaryAction={{
        label: "View Workflows",
        href: "/workflows",
      }}
    />
  );
}

export function EmptyDashboardState() {
  return (
    <EmptyState
      icon={<Sparkles className="w-8 h-8 text-[#194c92]" />}
      title="Welcome to Synth!"
      description="Get started by creating your first workflow. Our AI will help you build automations that save time and streamline your work."
      action={{
        label: "Create Your First Workflow",
        href: "/chat",
        variant: "default",
      }}
      secondaryAction={{
        label: "Explore Features",
        href: "/workflows",
      }}
    />
  );
}

