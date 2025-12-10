"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import AppCard from "@/components/app/AppCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TriggerType = "webhook" | "cron" | "manual";
type ActionType = "http_request" | "set_data" | "send_email" | "delay";

interface Action {
  id: string;
  type: ActionType;
  config: Record<string, unknown>;
  onSuccessNext: string[];
  onFailureNext: string[];
}

const templates = [
  { id: "1", name: "Send Welcome Email", trigger: "webhook", description: "Trigger on new user signup" },
  { id: "2", name: "Notify Slack on New Lead", trigger: "webhook", description: "Post to Slack channel" },
  { id: "3", name: "Daily Report", trigger: "cron", description: "Generate report every day at 9am" },
  { id: "4", name: "Manual Data Sync", trigger: "manual", description: "Run on demand" },
];

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("trigger");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [intent, setIntent] = useState("");
  
  // Trigger state
  const [triggerType, setTriggerType] = useState<TriggerType>("webhook");
  const [webhookPath, setWebhookPath] = useState("");
  const [webhookMethod, setWebhookMethod] = useState("POST");
  const [cronExpression, setCronExpression] = useState("");
  const [intervalAmount, setIntervalAmount] = useState("");
  const [intervalUnit, setIntervalUnit] = useState<"seconds" | "minutes" | "hours" | "days">("minutes");

  // Actions state
  const [actions, setActions] = useState<Action[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addAction = () => {
    const newAction: Action = {
      id: `action_${crypto.randomUUID().slice(0, 8)}`,
      type: "http_request",
      config: {},
      onSuccessNext: [],
      onFailureNext: [],
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<Action>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const updateActionConfig = (id: string, key: string, value: unknown) => {
    setActions(actions.map(a => 
      a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a
    ));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (triggerType === "webhook" && !webhookPath.trim()) {
      newErrors.webhookPath = "Path is required for webhook triggers";
    }

    if (triggerType === "cron" && !cronExpression.trim() && !intervalAmount.trim()) {
      newErrors.cron = "Either cron expression or interval is required";
    }

    // Validate actions
    actions.forEach((action, index) => {
      if (action.type === "http_request") {
        const url = action.config.url as string;
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
          newErrors[`action_${index}_url`] = "URL must start with http:// or https://";
        }
      }
      if (action.type === "send_email") {
        if (!action.config.to) newErrors[`action_${index}_to`] = "To is required";
        if (!action.config.subject) newErrors[`action_${index}_subject`] = "Subject is required";
        if (!action.config.body) newErrors[`action_${index}_body`] = "Body is required";
      }
    });

    // Check for duplicate action IDs
    const ids = actions.map(a => a.id);
    if (new Set(ids).size !== ids.length) {
      newErrors.actions = "Duplicate action IDs detected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildTrigger = () => {
    switch (triggerType) {
      case "webhook":
        return {
          type: "webhook",
          config: {
            path: webhookPath,
            method: webhookMethod,
          },
        };
      case "cron":
        if (cronExpression) {
          return { type: "cron", config: { expression: cronExpression } };
        }
        return {
          type: "cron",
          config: {
            interval: { amount: parseInt(intervalAmount), unit: intervalUnit },
          },
        };
      case "manual":
        return { type: "manual", config: {} };
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);

    const workflow = {
      name: name.trim(),
      description: description.trim() || undefined,
      intent: intent.trim() || undefined,
      trigger: buildTrigger(),
      actions: actions.map(a => ({
        id: a.id,
        type: a.type,
        config: a.config,
        onSuccessNext: a.onSuccessNext,
        onFailureNext: a.onFailureNext.length > 0 ? a.onFailureNext : undefined,
      })),
    };

    // TODO: Call API endpoint
    await new Promise(r => setTimeout(r, 1500));
    
    toast.success("Workflow created successfully");
    setIsSubmitting(false);
    router.push("/workflows");
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setName(template.name);
      setTriggerType(template.trigger as TriggerType);
      if (template.trigger === "webhook") {
        setWebhookPath("/webhook/" + template.name.toLowerCase().replace(/\s+/g, "-"));
      }
    }
  };

  const renderActionFields = (action: Action, index: number) => {
    switch (action.type) {
      case "http_request":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={(action.config.url as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "url", e.target.value)}
                className={errors[`action_${index}_url`] ? "border-red-500" : ""}
              />
              {errors[`action_${index}_url`] && (
                <p className="text-xs text-red-400">{errors[`action_${index}_url`]}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={(action.config.method as string) || "GET"}
                  onValueChange={(v) => updateActionConfig(action.id, "method", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token"}'
                value={(action.config.headers as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "headers", e.target.value)}
                className="font-mono text-xs min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                value={(action.config.body as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "body", e.target.value)}
                className="font-mono text-xs min-h-[60px]"
              />
            </div>
          </div>
        );
      case "send_email":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>To *</Label>
              <Input
                placeholder="recipient@example.com"
                value={(action.config.to as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "to", e.target.value)}
                className={errors[`action_${index}_to`] ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Email subject"
                value={(action.config.subject as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "subject", e.target.value)}
                className={errors[`action_${index}_subject`] ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <Textarea
                placeholder="Email body content"
                value={(action.config.body as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "body", e.target.value)}
                className={cn("min-h-[80px]", errors[`action_${index}_body`] ? "border-red-500" : "")}
              />
            </div>
            <div className="space-y-2">
              <Label>From (optional)</Label>
              <Input
                placeholder="sender@example.com"
                value={(action.config.from as string) || ""}
                onChange={(e) => updateActionConfig(action.id, "from", e.target.value)}
              />
            </div>
          </div>
        );
      case "set_data":
        return (
          <div className="space-y-2">
            <Label>Fields (JSON object)</Label>
            <Textarea
              placeholder='{"field1": "value1", "field2": "value2"}'
              value={(action.config.fields as string) || ""}
              onChange={(e) => updateActionConfig(action.id, "fields", e.target.value)}
              className="font-mono text-xs min-h-[80px]"
            />
          </div>
        );
      case "delay":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={(action.config.amount as string) || ""}
                  onChange={(e) => updateActionConfig(action.id, "amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={(action.config.unit as string) || "seconds"}
                  onValueChange={(v) => updateActionConfig(action.id, "unit", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Or specify duration in milliseconds:</p>
            <Input
              type="number"
              placeholder="5000"
              value={(action.config.durationMs as string) || ""}
              onChange={(e) => updateActionConfig(action.id, "durationMs", e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">Create Workflow</h1>

      {/* Templates */}
      <AppCard className="mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Start from a Template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className="px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 text-left transition-all"
            >
              <p className="font-medium text-foreground text-sm">{template.name}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>
      </AppCard>

      {/* Basic Info */}
      <AppCard className="mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="My Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intent">Intent (optional)</Label>
            <Input
              id="intent"
              placeholder="Automate lead notifications"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
          </div>
        </div>
      </AppCard>

      {/* Trigger Configuration */}
      <AppCard className="mb-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedSection(expandedSection === "trigger" ? null : "trigger")}
        >
          <h2 className="text-lg font-medium text-foreground">Trigger Configuration</h2>
          {expandedSection === "trigger" ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <AnimatePresence>
          {expandedSection === "trigger" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <Label>Trigger Type *</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="cron">Cron / Scheduled</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "webhook" && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label>Path *</Label>
                    <Input
                      placeholder="/webhook/my-workflow"
                      value={webhookPath}
                      onChange={(e) => setWebhookPath(e.target.value)}
                      className={errors.webhookPath ? "border-red-500" : ""}
                    />
                    {errors.webhookPath && <p className="text-xs text-red-400">{errors.webhookPath}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {triggerType === "cron" && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input
                      placeholder="0 9 * * *"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">e.g., "0 9 * * *" for every day at 9am</p>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">or</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Interval Amount</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={intervalAmount}
                        onChange={(e) => setIntervalAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={intervalUnit} onValueChange={(v) => setIntervalUnit(v as typeof intervalUnit)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seconds">Seconds</SelectItem>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {errors.cron && <p className="text-xs text-red-400">{errors.cron}</p>}
                </div>
              )}

              {triggerType === "manual" && (
                <p className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                  This workflow will only run when triggered manually from the dashboard.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </AppCard>

      {/* Actions */}
      <AppCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Actions</h2>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="w-4 h-4 mr-1" />
            Add Action
          </Button>
        </div>

        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No actions added yet. Add an action to define what happens when this workflow runs.
          </p>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{action.id}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeAction(action.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select
                      value={action.type}
                      onValueChange={(v) => updateAction(action.id, { type: v as ActionType, config: {} })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="http_request">HTTP Request</SelectItem>
                        <SelectItem value="send_email">Send Email</SelectItem>
                        <SelectItem value="set_data">Set Data</SelectItem>
                        <SelectItem value="delay">Delay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {renderActionFields(action, index)}

                  <div className="space-y-2">
                    <Label>On Success, go to (action IDs)</Label>
                    <Input
                      placeholder="action_abc123, action_def456"
                      value={action.onSuccessNext.join(", ")}
                      onChange={(e) => updateAction(action.id, { 
                        onSuccessNext: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                      })}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {errors.actions && <p className="text-xs text-red-400 mt-2">{errors.actions}</p>}
      </AppCard>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Workflow"
        )}
      </Button>
    </div>
  );
}
