import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessRule, RulePriority } from "./BusinessRuleCard";

interface BusinessRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Partial<BusinessRule>) => void;
  rule?: BusinessRule | null;
  mode: "create" | "edit";
}

const BusinessRuleModal = ({ open, onClose, onSave, rule, mode }: BusinessRuleModalProps) => {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<RulePriority>("medium");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (rule && mode === "edit") {
      setContent(rule.content);
      setPriority(rule.priority);
    } else {
      setContent("");
      setPriority("medium");
    }
  }, [rule, mode, open]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    onSave({
      id: rule?.id,
      content: content.trim(),
      priority,
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Business Rule" : "Edit Business Rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rule Content *</Label>
            <Textarea
              placeholder="Describe the rule Synth should follow..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-background border-border min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as RulePriority)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium (Default)</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              High priority rules take precedence when there are conflicts.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!content.trim() || isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessRuleModal;



