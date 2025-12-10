import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  Webhook, 
  Hand, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Link2,
  Zap
} from "lucide-react";

interface WorkflowAction {
  id: string;
  type: string;
  onSuccessNext?: string[];
  onFailureNext?: string[];
}

interface TriggerData {
  type: string;
  config?: Record<string, unknown>;
}

interface WorkflowSummaryCardProps {
  name: string;
  description?: string;
  intent?: string;
  trigger: TriggerData;
  actions: WorkflowAction[];
  validationErrors: string[];
  requiredConnections: string[];
}

const triggerLabels: Record<string, { label: string; icon: React.ElementType }> = {
  webhook: { label: "Webhook Trigger", icon: Webhook },
  cron: { label: "Scheduled Trigger", icon: Clock },
  schedule: { label: "Scheduled Trigger", icon: Clock },
  manual: { label: "Manual Trigger", icon: Hand },
  event: { label: "Event Trigger", icon: Zap },
};

const actionTypeLabels: Record<string, string> = {
  http_request: "HTTP Request",
  set_data: "Set Data",
  send_email: "Send Email",
  delay: "Delay",
  slack_message: "Slack Message",
  send_sms: "Send SMS",
  database_insert: "Insert Record",
  database_update: "Update Record",
  crm_create: "Create CRM Contact",
  notion_create: "Create Notion Page",
  append_sheet: "Append to Sheet",
  branch: "Condition Branch",
  transform: "Transform Text",
};

export function WorkflowSummaryCard({
  name,
  description,
  intent,
  trigger,
  actions,
  validationErrors,
  requiredConnections,
}: WorkflowSummaryCardProps) {
  const triggerInfo = triggerLabels[trigger.type] || { label: "Unknown Trigger", icon: Zap };
  const TriggerIcon = triggerInfo.icon;
  const isValid = validationErrors.length === 0;
  
  const startingActions = actions.filter(a => {
    const isTargeted = actions.some(other => 
      other.onSuccessNext?.includes(a.id) || other.onFailureNext?.includes(a.id)
    );
    return !isTargeted;
  });

  const getTriggerDescription = () => {
    if (trigger.type === "webhook") {
      const path = trigger.config?.path as string;
      return `POST to ${path || "/webhook"}`;
    }
    if (trigger.type === "cron" || trigger.type === "schedule") {
      const mode = trigger.config?.mode as string;
      if (mode === "interval") {
        return `Every ${trigger.config?.intervalAmount || 1} ${trigger.config?.intervalUnit || "hours"}`;
      }
      const expr = trigger.config?.expression as string;
      if (expr) return `Cron: ${expr}`;
      const freq = trigger.config?.frequency as string;
      const time = trigger.config?.time as string;
      return `${freq || "Daily"} at ${time || "09:00"}`;
    }
    return "Triggered manually";
  };

  return (
    <Card className="bg-card border-border/50 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Workflow Summary
          </span>
          {isValid ? (
            <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
              <AlertCircle className="w-3 h-3 mr-1" /> {validationErrors.length} issues
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name & Intent */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{name || "Untitled Workflow"}</p>
          {intent && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 mt-0.5 text-primary" />
              <span>{intent}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>

        {/* Trigger */}
        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <TriggerIcon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{triggerInfo.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{getTriggerDescription()}</p>
        </div>

        {/* Actions Flow */}
        {actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Actions Flow ({actions.length})</p>
            <div className="space-y-1">
              {startingActions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">START</Badge>
                  <span className="text-foreground">
                    {actionTypeLabels[action.type] || action.type}
                  </span>
                  {action.onSuccessNext && action.onSuccessNext.length > 0 && (
                    <>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {action.onSuccessNext.length} next
                      </span>
                    </>
                  )}
                </div>
              ))}
              {actions.filter(a => !startingActions.includes(a)).map((action) => (
                <div key={action.id} className="flex items-center gap-2 text-xs pl-4">
                  <span className="text-muted-foreground">↳</span>
                  <span className="text-foreground">
                    {actionTypeLabels[action.type] || action.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Connections */}
        {requiredConnections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Required Connections
            </p>
            <div className="flex flex-wrap gap-1">
              {requiredConnections.map((conn) => (
                <Badge key={conn} variant="outline" className="text-[10px]">
                  {conn}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-1 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs font-medium text-destructive">Validation Issues:</p>
            {validationErrors.slice(0, 5).map((error, i) => (
              <p key={i} className="text-xs text-destructive/80 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            ))}
            {validationErrors.length > 5 && (
              <p className="text-xs text-destructive/60">
                +{validationErrors.length - 5} more issues
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WorkflowSummaryCard;



