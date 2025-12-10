import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AIAssistPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (suggestions: AISuggestion) => void;
}

interface AISuggestion {
  actionType: string;
  category: string;
  config: Record<string, unknown>;
  reasoning: string;
}

// Simulated AI responses based on keywords in the description
const generateSuggestion = (description: string): AISuggestion => {
  const lowerDesc = description.toLowerCase();
  
  // Email-related
  if (lowerDesc.includes("email") || lowerDesc.includes("mail")) {
    if (lowerDesc.includes("welcome")) {
      return {
        actionType: "send_email",
        category: "notifications",
        config: {
          to: "{{user.email}}",
          subject: "Welcome to our platform!",
          body: "Hi {{user.name}},\n\nWelcome aboard! We're excited to have you.\n\nBest regards,\nThe Team"
        },
        reasoning: "Detected 'welcome' and 'email' - suggesting a welcome email template."
      };
    }
    return {
      actionType: "send_email",
      category: "notifications",
      config: {
        to: "{{user.email}}",
        subject: "",
        body: ""
      },
      reasoning: "Detected email-related intent."
    };
  }
  
  // Slack-related
  if (lowerDesc.includes("slack") || lowerDesc.includes("notification") || lowerDesc.includes("notify team")) {
    return {
      actionType: "slack_message",
      category: "notifications",
      config: {
        channel: "#notifications",
        message: "{{event.summary}}",
        includeAttachments: false
      },
      reasoning: "Detected Slack/team notification intent."
    };
  }
  
  // SMS-related
  if (lowerDesc.includes("sms") || lowerDesc.includes("text message") || lowerDesc.includes("phone")) {
    return {
      actionType: "send_sms",
      category: "notifications",
      config: {
        phoneNumber: "{{user.phone}}",
        message: ""
      },
      reasoning: "Detected SMS/text message intent."
    };
  }
  
  // Database-related
  if (lowerDesc.includes("save") || lowerDesc.includes("store") || lowerDesc.includes("database") || lowerDesc.includes("record")) {
    if (lowerDesc.includes("update") || lowerDesc.includes("modify")) {
      return {
        actionType: "database_update",
        category: "data",
        config: {
          table: "records",
          recordId: "{{record.id}}",
          fields: [{ key: "updated_at", value: "{{now}}" }]
        },
        reasoning: "Detected database update intent."
      };
    }
    return {
      actionType: "database_insert",
      category: "data",
      config: {
        table: "records",
        fields: [{ key: "user_id", value: "{{user.id}}" }, { key: "created_at", value: "{{now}}" }]
      },
      reasoning: "Detected database insert intent."
    };
  }
  
  // Spreadsheet-related
  if (lowerDesc.includes("spreadsheet") || lowerDesc.includes("sheet") || lowerDesc.includes("excel") || lowerDesc.includes("google sheet")) {
    return {
      actionType: "append_sheet",
      category: "data",
      config: {
        spreadsheetId: "",
        sheetName: "Sheet1",
        fields: [{ key: "Name", value: "{{user.name}}" }, { key: "Email", value: "{{user.email}}" }]
      },
      reasoning: "Detected spreadsheet/sheet intent."
    };
  }
  
  // CRM-related
  if (lowerDesc.includes("crm") || lowerDesc.includes("contact") || lowerDesc.includes("lead") || lowerDesc.includes("hubspot") || lowerDesc.includes("salesforce")) {
    return {
      actionType: "crm_create",
      category: "integrations",
      config: {
        crm: "hubspot",
        firstName: "{{user.firstName}}",
        lastName: "{{user.lastName}}",
        email: "{{user.email}}",
        phone: "{{user.phone}}",
        customFields: []
      },
      reasoning: "Detected CRM/contact creation intent."
    };
  }
  
  // Notion-related
  if (lowerDesc.includes("notion") || lowerDesc.includes("page")) {
    return {
      actionType: "notion_create",
      category: "integrations",
      config: {
        databaseId: "",
        title: "{{title}}",
        properties: [],
        content: ""
      },
      reasoning: "Detected Notion page creation intent."
    };
  }
  
  // API/HTTP-related
  if (lowerDesc.includes("api") || lowerDesc.includes("http") || lowerDesc.includes("request") || lowerDesc.includes("webhook")) {
    return {
      actionType: "http_request",
      category: "integrations",
      config: {
        method: "POST",
        url: "",
        headers: [{ key: "Content-Type", value: "application/json" }],
        body: "{}"
      },
      reasoning: "Detected API/HTTP request intent."
    };
  }
  
  // Delay-related
  if (lowerDesc.includes("wait") || lowerDesc.includes("delay") || lowerDesc.includes("pause")) {
    const timeMatch = lowerDesc.match(/(\d+)\s*(second|minute|hour)/);
    return {
      actionType: "delay",
      category: "logic",
      config: {
        duration: timeMatch ? parseInt(timeMatch[1]) : 5,
        unit: timeMatch ? timeMatch[2] + "s" : "seconds"
      },
      reasoning: "Detected delay/wait intent."
    };
  }
  
  // Branch/condition-related
  if (lowerDesc.includes("if") || lowerDesc.includes("condition") || lowerDesc.includes("branch") || lowerDesc.includes("check")) {
    return {
      actionType: "branch",
      category: "logic",
      config: {
        condition: "",
        trueBranch: "continue",
        falseBranch: "skip"
      },
      reasoning: "Detected conditional logic intent."
    };
  }
  
  // Transform-related
  if (lowerDesc.includes("transform") || lowerDesc.includes("convert") || lowerDesc.includes("uppercase") || lowerDesc.includes("lowercase")) {
    return {
      actionType: "transform",
      category: "logic",
      config: {
        input: "{{input}}",
        operation: lowerDesc.includes("lowercase") ? "lowercase" : "uppercase",
        output: "transformedValue"
      },
      reasoning: "Detected text transformation intent."
    };
  }
  
  // Default fallback
  return {
    actionType: "send_email",
    category: "notifications",
    config: {
      to: "{{user.email}}",
      subject: "",
      body: ""
    },
    reasoning: "Could not determine specific intent. Defaulting to email action."
  };
};

export function AIAssistPanel({ open, onClose, onApply }: AIAssistPanelProps) {
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = generateSuggestion(description);
    setSuggestion(result);
    setIsProcessing(false);
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
      handleClose();
    }
  };

  const handleClose = () => {
    setDescription("");
    setSuggestion(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Assisted Editing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Describe what this step should do:
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Send the user a welcome email with their name and signup time"
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!description.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Suggestion
              </>
            )}
          </Button>

          {suggestion && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Suggested Action:</span>
                <p className="text-sm font-medium text-foreground capitalize">
                  {suggestion.actionType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Category:</span>
                <p className="text-sm font-medium text-foreground capitalize">
                  {suggestion.category}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Reasoning:</span>
                <p className="text-sm text-muted-foreground">
                  {suggestion.reasoning}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Preview:</span>
                <pre className="mt-1 p-2 rounded bg-background/50 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(suggestion.config, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!suggestion}>
            Apply Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { AISuggestion };



