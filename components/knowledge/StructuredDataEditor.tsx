import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StructuredDataItem, StructuredType } from "./StructuredItemCard";

interface StructuredDataEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (items: Partial<StructuredDataItem>[]) => void;
  item?: StructuredDataItem | null;
  mode: "create" | "edit";
}

const StructuredDataEditor = ({ open, onClose, onSave, item, mode }: StructuredDataEditorProps) => {
  const [type, setType] = useState<StructuredType>("company_info");
  const [entries, setEntries] = useState<Record<string, string>[]>([{}]);
  const [isLoading, setIsLoading] = useState(false);

  const fieldsByType: Record<StructuredType, { key: string; label: string; required?: boolean }[]> = {
    company_info: [
      { key: "name", label: "Company Name", required: true },
      { key: "industry", label: "Industry" },
      { key: "description", label: "Description" },
      { key: "website", label: "Website" },
    ],
    product: [
      { key: "name", label: "Product Name", required: true },
      { key: "description", label: "Description" },
      { key: "price", label: "Price" },
      { key: "features", label: "Key Features" },
    ],
    team_member: [
      { key: "name", label: "Name", required: true },
      { key: "role", label: "Role" },
      { key: "email", label: "Email" },
      { key: "responsibilities", label: "Responsibilities" },
    ],
    tool: [
      { key: "name", label: "Tool Name", required: true },
      { key: "purpose", label: "Purpose" },
      { key: "usage", label: "How to Use" },
      { key: "documentation", label: "Documentation URL" },
    ],
  };

  useEffect(() => {
    if (item && mode === "edit") {
      setType(item.type);
      setEntries([item.data as Record<string, string>]);
    } else {
      setType("company_info");
      setEntries([{}]);
    }
  }, [item, mode, open]);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const items = entries
      .filter((e) => e.name?.trim())
      .map((e) => ({
        id: item?.id,
        type,
        name: e.name || "",
        preview: Object.values(e).filter(Boolean).slice(0, 2).join(" - "),
        data: e,
      }));

    onSave(items);
    setIsLoading(false);
    onClose();
  };

  const updateEntry = (index: number, key: string, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [key]: value };
    setEntries(updated);
  };

  const addEntry = () => setEntries([...entries, {}]);
  const removeEntry = (index: number) => setEntries(entries.filter((_, i) => i !== index));

  const fields = fieldsByType[type];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Structured Data" : "Edit Structured Data"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StructuredType)} disabled={mode === "edit"}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_info">Company Info</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="team_member">Team Member</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entries.map((entry, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border bg-background/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Entry {idx + 1}</span>
                {entries.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEntry(idx)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.key} className={field.key === "description" || field.key === "features" || field.key === "responsibilities" || field.key === "usage" ? "sm:col-span-2" : ""}>
                    <Label className="text-xs">{field.label}{field.required && " *"}</Label>
                    {["description", "features", "responsibilities", "usage"].includes(field.key) ? (
                      <Textarea
                        value={entry[field.key] || ""}
                        onChange={(e) => updateEntry(idx, field.key, e.target.value)}
                        className="bg-background border-border mt-1 min-h-[60px]"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <Input
                        value={entry[field.key] || ""}
                        onChange={(e) => updateEntry(idx, field.key, e.target.value)}
                        className="bg-background border-border mt-1"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {mode === "create" && (
            <Button variant="outline" size="sm" onClick={addEntry}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Another Entry
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StructuredDataEditor;



