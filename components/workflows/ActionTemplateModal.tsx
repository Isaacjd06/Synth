import { useState } from "react";
import { 
  Mail, 
  MessageSquare, 
  Phone,
  Database, 
  FileText,
  Server,
  Link2,
  Timer,
  GitBranch,
  Settings,
  Bell,
  Cpu,
  Search
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActionTemplate {
  id: string;
  type: string;
  category: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultConfig: Record<string, unknown>;
}

const actionTemplates: ActionTemplate[] = [
  // Notifications
  {
    id: "send_email",
    type: "send_email",
    category: "notifications",
    label: "Send Email",
    description: "Send an email to a recipient with a subject and body",
    icon: Mail,
    defaultConfig: { to: "{{user.email}}", subject: "", body: "" }
  },
  {
    id: "slack_message",
    type: "slack_message",
    category: "notifications",
    label: "Send Slack Message",
    description: "Post a message to a Slack channel",
    icon: MessageSquare,
    defaultConfig: { channel: "#general", message: "", includeAttachments: false }
  },
  {
    id: "send_sms",
    type: "send_sms",
    category: "notifications",
    label: "Send SMS",
    description: "Send a text message to a phone number",
    icon: Phone,
    defaultConfig: { phoneNumber: "", message: "" }
  },
  // Data Operations
  {
    id: "database_insert",
    type: "database_insert",
    category: "data",
    label: "Insert Database Record",
    description: "Insert a new record into a database table",
    icon: Database,
    defaultConfig: { table: "", fields: [{ key: "", value: "" }] }
  },
  {
    id: "database_update",
    type: "database_update",
    category: "data",
    label: "Update Database Record",
    description: "Update an existing record in a database table",
    icon: Database,
    defaultConfig: { table: "", recordId: "", fields: [{ key: "", value: "" }] }
  },
  {
    id: "append_sheet",
    type: "append_sheet",
    category: "data",
    label: "Append to Spreadsheet",
    description: "Add a new row to a spreadsheet",
    icon: FileText,
    defaultConfig: { spreadsheetId: "", sheetName: "Sheet1", fields: [{ key: "", value: "" }] }
  },
  // Integrations
  {
    id: "crm_create",
    type: "crm_create",
    category: "integrations",
    label: "Create CRM Contact",
    description: "Create a new contact in your CRM",
    icon: Link2,
    defaultConfig: { crm: "hubspot", firstName: "", lastName: "", email: "", phone: "", customFields: [] }
  },
  {
    id: "notion_create",
    type: "notion_create",
    category: "integrations",
    label: "Create Notion Page",
    description: "Create a new page in a Notion database",
    icon: FileText,
    defaultConfig: { databaseId: "", title: "", properties: [], content: "" }
  },
  {
    id: "http_request",
    type: "http_request",
    category: "integrations",
    label: "HTTP API Request",
    description: "Make an HTTP request to any API endpoint",
    icon: Server,
    defaultConfig: { method: "POST", url: "", headers: [], body: "" }
  },
  // Logic / Utilities
  {
    id: "delay",
    type: "delay",
    category: "logic",
    label: "Delay",
    description: "Wait for a specified amount of time",
    icon: Timer,
    defaultConfig: { duration: 5, unit: "seconds" }
  },
  {
    id: "branch",
    type: "branch",
    category: "logic",
    label: "Condition / Branch",
    description: "Execute different paths based on a condition",
    icon: GitBranch,
    defaultConfig: { condition: "", trueBranch: "next_step", falseBranch: "skip" }
  },
  {
    id: "transform",
    type: "transform",
    category: "logic",
    label: "Transform Text",
    description: "Transform text with various operations",
    icon: Settings,
    defaultConfig: { input: "", operation: "uppercase", replaceFind: "", replaceWith: "", output: "" }
  },
];

const categoryConfig = {
  notifications: { label: "Notifications", icon: Bell, color: "text-blue-400" },
  data: { label: "Data Operations", icon: Database, color: "text-green-400" },
  integrations: { label: "Integrations", icon: Link2, color: "text-purple-400" },
  logic: { label: "Logic / Utilities", icon: Cpu, color: "text-orange-400" },
};

interface ActionTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ActionTemplate) => void;
}

export function ActionTemplateModal({ open, onClose, onSelectTemplate }: ActionTemplateModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = actionTemplates.filter(t => {
    const matchesSearch = search === "" || 
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ActionTemplate[]>);

  const handleSelect = (template: ActionTemplate) => {
    onSelectTemplate(template);
    onClose();
    setSearch("");
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Choose an Action Template</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Badge
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                className="cursor-pointer flex items-center gap-1"
                onClick={() => setSelectedCategory(key)}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Templates List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => {
              const catConfig = categoryConfig[category as keyof typeof categoryConfig];
              const CategoryIcon = catConfig?.icon || Bell;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryIcon className={`w-4 h-4 ${catConfig?.color || 'text-muted-foreground'}`} />
                    <h3 className="text-sm font-medium text-foreground">{catConfig?.label || category}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {templates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelect(template)}
                          className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {template.label}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {Object.keys(groupedTemplates).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No templates found matching your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export type { ActionTemplate };
export { actionTemplates };



