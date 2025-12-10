import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KnowledgeEntry } from "./KnowledgeCard";
import type { KnowledgeCategory } from "./KnowledgeCategoryBadge";

interface KnowledgeEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Partial<KnowledgeEntry>) => void;
  entry?: KnowledgeEntry | null;
  mode: "create" | "edit";
}

const KnowledgeEditorModal = ({
  open,
  onClose,
  onSave,
  entry,
  mode,
}: KnowledgeEditorModalProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("general");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (entry && mode === "edit") {
      setTitle(entry.title);
      setCategory(entry.category);
      setContent(entry.content);
      setTags(entry.tags?.join(", ") || "");
    } else {
      setTitle("");
      setCategory("general");
      setContent("");
      setTags("");
    }
  }, [entry, mode, open]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    onSave({
      id: entry?.id,
      title: title.trim(),
      category,
      content: content.trim(),
      preview: content.trim().slice(0, 100),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Entry" : "Edit Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title *</Label>
              <Input
                id="entry-title"
                placeholder="e.g., How to qualify a lead"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as KnowledgeCategory)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sop">SOP</SelectItem>
                  <SelectItem value="rule">Business Rule</SelectItem>
                  <SelectItem value="definition">Definition</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="general">General Knowledge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-content">Content *</Label>
            <Textarea
              id="entry-content"
              placeholder="Enter the knowledge content here. You can include step-by-step instructions, rules, definitions, etc."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-background border-border min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-tags">Tags (optional)</Label>
            <Input
              id="entry-tags"
              placeholder="sales, onboarding, leads (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Add tags to help organize and find this entry later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Entry"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeEditorModal;



