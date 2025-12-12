"use client";
import { 
  Webhook, 
  Clock, 
  Mail, 
  MessageSquare, 
  Zap, 
  Globe, 
  FileText,
  CreditCard,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TriggerType = 
  | "webhook" 
  | "schedule" 
  | "email" 
  | "slack" 
  | "api" 
  | "form" 
  | "stripe"
  | "manual";

interface WorkflowTriggerIconProps {
  trigger: TriggerType;
  showLabel?: boolean;
  className?: string;
}

const triggerConfig: Record<TriggerType, { icon: LucideIcon; label: string; color: string }> = {
  webhook: { icon: Webhook, label: "Webhook", color: "text-blue-400" },
  schedule: { icon: Clock, label: "Schedule", color: "text-purple-400" },
  email: { icon: Mail, label: "Email", color: "text-cyan-400" },
  slack: { icon: MessageSquare, label: "Slack", color: "text-green-400" },
  api: { icon: Zap, label: "API Event", color: "text-yellow-400" },
  form: { icon: FileText, label: "Form", color: "text-orange-400" },
  stripe: { icon: CreditCard, label: "Stripe", color: "text-pink-400" },
  manual: { icon: Globe, label: "Manual", color: "text-muted-foreground" },
};

const WorkflowTriggerIcon = ({ trigger, showLabel = false, className }: WorkflowTriggerIconProps) => {
  const config = triggerConfig[trigger];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("w-5 h-5", config.color)}>
        <Icon className="w-full h-full" />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
};

export default WorkflowTriggerIcon;
