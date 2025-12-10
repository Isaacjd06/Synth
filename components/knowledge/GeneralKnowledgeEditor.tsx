import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GeneralKnowledgeItem } from "./KnowledgeGeneralCard";
import type { GeneralKnowledgeType } from "./KnowledgeTypeBadge";

interface GeneralKnowledgeEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Partial<GeneralKnowledgeItem>) => void;
  item?: GeneralKnowledgeItem | null;
  mode: "create" | "edit";
}

const GeneralKnowledgeEditor = ({ open, onClose, onSave, item, mode }: GeneralKnowledgeEditorProps) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GeneralKnowledgeType>("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item && mode === "edit") {
      setTitle(item.title);
      setType(item.type);
      setContent(item.content);
      setUrl(item.url || "");
    } else {
      setTitle("");
      setType("text");
      setContent("");
      setUrl("");
    }
  }, [item, mode, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    onSave({
      id: item?.id,
      title: title.trim(),
      type,
      content: content.trim(),
      url: type === "url" ? url.trim() : undefined,
      preview: content.trim().slice(0, 100),
    });

    setIsLoading(false);
    onClose();
  };

  const renderContentInput = () => {
    switch (type) {
      case "text":
        return (
          <Textarea
            placeholder="Enter plain text content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-background border-border min-h-[150px]"
          />
        );
      case "markdown":
        return (
          <Textarea
            placeholder="Enter markdown content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-background border-border min-h-[200px] font-mono text-sm"
          />
        );
      case "url":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                type="url"
                placeholder="https://example.com/resource"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe what this URL contains..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-background border-border min-h-[80px]"
              />
            </div>
          </div>
        );
      case "file":
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Select a file to reference</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">PDF, TXT, MD, DOCX, CSV</p>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe the file contents..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-background border-border min-h-[80px]"
              />
            </div>
          </div>
        );
      case "structured_doc":
        return (
          <Textarea
            placeholder="Enter structured document content. Use headers, lists, and formatting..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-background border-border min-h-[250px]"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Knowledge" : "Edit Knowledge"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Company refund policy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as GeneralKnowledgeType)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Plain Text</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="url">URL Reference</SelectItem>
                  <SelectItem value="file">File Reference</SelectItem>
                  <SelectItem value="structured_doc">Structured Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{type === "url" ? "URL & Description" : "Content"}</Label>
            {renderContentInput()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneralKnowledgeEditor;



