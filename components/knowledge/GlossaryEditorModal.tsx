import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { GlossaryEntry } from "./GlossaryEntryCard";

interface GlossaryEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Partial<GlossaryEntry>) => void;
  entry?: GlossaryEntry | null;
  mode: "create" | "edit";
}

const GlossaryEditorModal = ({ open, onClose, onSave, entry, mode }: GlossaryEditorModalProps) => {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (entry && mode === "edit") {
      setTerm(entry.term);
      setDefinition(entry.definition);
    } else {
      setTerm("");
      setDefinition("");
    }
  }, [entry, mode, open]);

  const handleSave = async () => {
    if (!term.trim() || !definition.trim()) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    onSave({
      id: entry?.id,
      term: term.trim(),
      definition: definition.trim(),
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Glossary Term" : "Edit Glossary Term"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Term *</Label>
            <Input
              placeholder="e.g., MQL"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Definition *</Label>
            <Textarea
              placeholder="Define the term..."
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!term.trim() || !definition.trim() || isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlossaryEditorModal;



