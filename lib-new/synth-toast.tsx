import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  ToggleLeft,
  CreditCard,
  RefreshCw
} from "lucide-react";

type ToastType = 
  | "success" 
  | "error" 
  | "warning" 
  | "workflow-created" 
  | "workflow-updated"
  | "subscription-activated"
  | "execution-failed"
  | "skill-enabled"
  | "skill-disabled";

interface SynthToastOptions {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

const toastConfig: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    className: "border-emerald-500/30 bg-emerald-500/5",
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    className: "border-red-500/30 bg-red-500/5",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    className: "border-amber-500/30 bg-amber-500/5",
  },
  "workflow-created": {
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    className: "border-primary/30 bg-primary/5",
  },
  "workflow-updated": {
    icon: <RefreshCw className="w-5 h-5 text-primary" />,
    className: "border-primary/30 bg-primary/5",
  },
  "subscription-activated": {
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
    className: "border-emerald-500/30 bg-emerald-500/5",
  },
  "execution-failed": {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    className: "border-red-500/30 bg-red-500/5",
  },
  "skill-enabled": {
    icon: <ToggleLeft className="w-5 h-5 text-emerald-400" />,
    className: "border-emerald-500/30 bg-emerald-500/5",
  },
  "skill-disabled": {
    icon: <Zap className="w-5 h-5 text-muted-foreground" />,
    className: "border-border/50 bg-muted/20",
  },
};

export function showToast({ type, title, description, duration = 4000 }: SynthToastOptions) {
  const config = toastConfig[type];
  
  toast.custom(
    (t) => (
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg ${config.className}`}
      >
        <div className="shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 font-light">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    ),
    { duration }
  );
}

// Convenience functions
export const synthToast = {
  success: (title: string, description?: string) =>
    showToast({ type: "success", title, description }),
  
  error: (title: string, description?: string) =>
    showToast({ type: "error", title, description }),
  
  warning: (title: string, description?: string) =>
    showToast({ type: "warning", title, description }),
  
  workflowCreated: (name?: string) =>
    showToast({
      type: "workflow-created",
      title: "Workflow Created",
      description: name ? `"${name}" is now ready to run.` : "Your automation is ready.",
    }),
  
  workflowUpdated: (name?: string) =>
    showToast({
      type: "workflow-updated",
      title: "Workflow Updated",
      description: name ? `"${name}" has been updated.` : "Changes saved successfully.",
    }),
  
  subscriptionActivated: (plan?: string) =>
    showToast({
      type: "subscription-activated",
      title: "Subscription Activated",
      description: plan ? `You're now on the ${plan} plan.` : "Welcome to Synth!",
    }),
  
  executionFailed: (workflowName?: string) =>
    showToast({
      type: "execution-failed",
      title: "Execution Failed",
      description: workflowName ? `"${workflowName}" encountered an error.` : "Check the execution details.",
    }),
  
  skillEnabled: (skillName?: string) =>
    showToast({
      type: "skill-enabled",
      title: "Skill Enabled",
      description: skillName ? `"${skillName}" is now active.` : "Automation enabled.",
    }),
  
  skillDisabled: (skillName?: string) =>
    showToast({
      type: "skill-disabled",
      title: "Skill Disabled",
      description: skillName ? `"${skillName}" has been paused.` : "Automation paused.",
    }),
};
