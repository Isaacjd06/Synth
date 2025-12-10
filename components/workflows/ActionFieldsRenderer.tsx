import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface KeyValuePair {
  key: string;
  value: string;
}

interface ActionConfig {
  [key: string]: unknown;
}

interface ActionFieldsRendererProps {
  actionId: string;
  actionType: string;
  config: ActionConfig;
  isReadOnly: boolean;
  onUpdateConfig: (actionId: string, field: string, value: unknown) => void;
}

// Helper component for key-value pairs editor
function KeyValueEditor({
  pairs,
  onChange,
  keyLabel = "Key",
  valueLabel = "Value",
  keyPlaceholder = "field_name",
  valuePlaceholder = "{{value}}",
  isReadOnly,
}: {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  isReadOnly: boolean;
}) {
  const addPair = () => {
    onChange([...pairs, { key: "", value: "" }]);
  };

  const updatePair = (index: number, field: "key" | "value", value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange(newPairs);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr,1fr,auto] gap-2 text-xs text-muted-foreground">
        <span>{keyLabel}</span>
        <span>{valueLabel}</span>
        <span className="w-8"></span>
      </div>
      {pairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2">
          <Input
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            placeholder={keyPlaceholder}
            disabled={isReadOnly}
            className="text-sm"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            placeholder={valuePlaceholder}
            disabled={isReadOnly}
            className="text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removePair(index)}
            disabled={isReadOnly}
            className="h-9 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addPair}
        disabled={isReadOnly}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Field
      </Button>
    </div>
  );
}

export function ActionFieldsRenderer({
  actionId,
  actionType,
  config,
  isReadOnly,
  onUpdateConfig,
}: ActionFieldsRendererProps) {
  const update = (field: string, value: unknown) => {
    onUpdateConfig(actionId, field, value);
  };

  switch (actionType) {
    // ==========================
    // NOTIFICATIONS
    // ==========================
    case "send_email":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">To (Email)</Label>
            <Input
              value={(config.to as string) || ""}
              onChange={(e) => update("to", e.target.value)}
              placeholder="{{user.email}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={(config.subject as string) || ""}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Enter email subject"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Message Body</Label>
            <Textarea
              value={(config.body as string) || ""}
              onChange={(e) => update("body", e.target.value)}
              placeholder="Enter email body"
              disabled={isReadOnly}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
      );

    case "slack_message":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Channel</Label>
            <Input
              value={(config.channel as string) || ""}
              onChange={(e) => update("channel", e.target.value)}
              placeholder="#general"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={(config.message as string) || ""}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Enter message"
              disabled={isReadOnly}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-xs text-muted-foreground">Include Attachments</Label>
            <Switch
              checked={(config.includeAttachments as boolean) || false}
              onCheckedChange={(checked) => update("includeAttachments", checked)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      );

    case "send_sms":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Phone Number</Label>
            <Input
              value={(config.phoneNumber as string) || ""}
              onChange={(e) => update("phoneNumber", e.target.value)}
              placeholder="+1234567890 or {{user.phone}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={(config.message as string) || ""}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Enter SMS message (160 char limit recommended)"
              disabled={isReadOnly}
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
      );

    // ==========================
    // DATA OPERATIONS
    // ==========================
    case "database_insert":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Table Name</Label>
            <Input
              value={(config.table as string) || ""}
              onChange={(e) => update("table", e.target.value)}
              placeholder="users"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Fields</Label>
            <KeyValueEditor
              pairs={(config.fields as KeyValuePair[]) || []}
              onChange={(pairs) => update("fields", pairs)}
              keyLabel="Column"
              valueLabel="Value"
              keyPlaceholder="column_name"
              valuePlaceholder="{{value}}"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      );

    case "database_update":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Table Name</Label>
            <Input
              value={(config.table as string) || ""}
              onChange={(e) => update("table", e.target.value)}
              placeholder="users"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Record Identifier (ID or condition)</Label>
            <Input
              value={(config.recordId as string) || ""}
              onChange={(e) => update("recordId", e.target.value)}
              placeholder="{{record.id}} or id = 123"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Fields to Update</Label>
            <KeyValueEditor
              pairs={(config.fields as KeyValuePair[]) || []}
              onChange={(pairs) => update("fields", pairs)}
              keyLabel="Column"
              valueLabel="New Value"
              keyPlaceholder="column_name"
              valuePlaceholder="{{new_value}}"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      );

    case "append_sheet":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Spreadsheet ID</Label>
            <Input
              value={(config.spreadsheetId as string) || ""}
              onChange={(e) => update("spreadsheetId", e.target.value)}
              placeholder="1BxiMkdF... (from URL)"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Sheet Name</Label>
            <Input
              value={(config.sheetName as string) || ""}
              onChange={(e) => update("sheetName", e.target.value)}
              placeholder="Sheet1"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Row Fields</Label>
            <KeyValueEditor
              pairs={(config.fields as KeyValuePair[]) || []}
              onChange={(pairs) => update("fields", pairs)}
              keyLabel="Column"
              valueLabel="Value"
              keyPlaceholder="A or Name"
              valuePlaceholder="{{value}}"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      );

    // ==========================
    // INTEGRATIONS
    // ==========================
    case "crm_create":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">CRM Platform</Label>
            <Select
              value={(config.crm as string) || "hubspot"}
              onValueChange={(value) => update("crm", value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="salesforce">Salesforce</SelectItem>
                <SelectItem value="pipedrive">Pipedrive</SelectItem>
                <SelectItem value="zoho">Zoho CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <Input
                value={(config.firstName as string) || ""}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="{{user.firstName}}"
                disabled={isReadOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input
                value={(config.lastName as string) || ""}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="{{user.lastName}}"
                disabled={isReadOnly}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              value={(config.email as string) || ""}
              onChange={(e) => update("email", e.target.value)}
              placeholder="{{user.email}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              value={(config.phone as string) || ""}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="{{user.phone}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Custom Fields</Label>
            <KeyValueEditor
              pairs={(config.customFields as KeyValuePair[]) || []}
              onChange={(pairs) => update("customFields", pairs)}
              keyLabel="Field"
              valueLabel="Value"
              keyPlaceholder="company"
              valuePlaceholder="{{company}}"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      );

    case "notion_create":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Database ID</Label>
            <Input
              value={(config.databaseId as string) || ""}
              onChange={(e) => update("databaseId", e.target.value)}
              placeholder="abc123... (from Notion URL)"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={(config.title as string) || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="{{title}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Properties</Label>
            <KeyValueEditor
              pairs={(config.properties as KeyValuePair[]) || []}
              onChange={(pairs) => update("properties", pairs)}
              keyLabel="Property"
              valueLabel="Value"
              keyPlaceholder="Status"
              valuePlaceholder="In Progress"
              isReadOnly={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Content</Label>
            <Textarea
              value={(config.content as string) || ""}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Page content (supports basic markdown)"
              disabled={isReadOnly}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
      );

    case "http_request":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Method</Label>
            <Select
              value={(config.method as string) || "POST"}
              onValueChange={(value) => update("method", value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              value={(config.url as string) || ""}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://api.example.com/endpoint"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Headers</Label>
            <KeyValueEditor
              pairs={(config.headers as KeyValuePair[]) || []}
              onChange={(pairs) => update("headers", pairs)}
              keyLabel="Header"
              valueLabel="Value"
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
              isReadOnly={isReadOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Request Body</Label>
            <Textarea
              value={(config.body as string) || ""}
              onChange={(e) => update("body", e.target.value)}
              placeholder='{"key": "value"}'
              disabled={isReadOnly}
              className="mt-1 min-h-[100px] font-mono text-sm"
            />
          </div>
        </div>
      );

    // ==========================
    // LOGIC / UTILITIES
    // ==========================
    case "delay":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Input
                type="number"
                value={(config.duration as number) || 5}
                onChange={(e) => update("duration", parseInt(e.target.value) || 0)}
                placeholder="5"
                disabled={isReadOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <Select
                value={(config.unit as string) || "seconds"}
                onValueChange={(value) => update("unit", value)}
                disabled={isReadOnly}
              >
                <SelectTrigger className="mt-1">
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
        </div>
      );

    case "branch":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Condition Expression</Label>
            <Input
              value={(config.condition as string) || ""}
              onChange={(e) => update("condition", e.target.value)}
              placeholder="{{user.plan}} == 'premium'"
              disabled={isReadOnly}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use expressions like: {'{{variable}} == "value"'} or {'{{count}} > 10'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">If True → Go to</Label>
              <Input
                value={(config.trueBranch as string) || ""}
                onChange={(e) => update("trueBranch", e.target.value)}
                placeholder="next_step"
                disabled={isReadOnly}
                className="mt-1 bg-green-500/5 border-green-500/20"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">If False → Go to</Label>
              <Input
                value={(config.falseBranch as string) || ""}
                onChange={(e) => update("falseBranch", e.target.value)}
                placeholder="skip_to_end"
                disabled={isReadOnly}
                className="mt-1 bg-red-500/5 border-red-500/20"
              />
            </div>
          </div>
        </div>
      );

    case "transform":
      const transformOp = (config.operation as string) || "uppercase";
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Input Text</Label>
            <Input
              value={(config.input as string) || ""}
              onChange={(e) => update("input", e.target.value)}
              placeholder="{{user.name}}"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Transformation Type</Label>
            <Select
              value={transformOp}
              onValueChange={(value) => update("operation", value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uppercase">Uppercase</SelectItem>
                <SelectItem value="lowercase">Lowercase</SelectItem>
                <SelectItem value="replace">Replace Text</SelectItem>
                <SelectItem value="trim">Trim Whitespace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {transformOp === "replace" && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Find</Label>
                <Input
                  value={(config.replaceFind as string) || ""}
                  onChange={(e) => update("replaceFind", e.target.value)}
                  placeholder="text to find"
                  disabled={isReadOnly}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Replace With</Label>
                <Input
                  value={(config.replaceWith as string) || ""}
                  onChange={(e) => update("replaceWith", e.target.value)}
                  placeholder="replacement text"
                  disabled={isReadOnly}
                  className="mt-1"
                />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Output Variable Name</Label>
            <Input
              value={(config.output as string) || ""}
              onChange={(e) => update("output", e.target.value)}
              placeholder="transformedValue"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>
        </div>
      );

    default:
      if (!actionType) {
        return (
          <p className="text-sm text-muted-foreground italic py-2">
            Select an action type to configure this step.
          </p>
        );
      }
      return (
        <p className="text-sm text-muted-foreground py-2">
          Unknown action type. Configure in Advanced Editing mode.
        </p>
      );
  }
}



