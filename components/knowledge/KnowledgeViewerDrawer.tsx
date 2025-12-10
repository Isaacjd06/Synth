import { Calendar, Clock, FileText, Link, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import KnowledgeTypeBadge from "./KnowledgeTypeBadge";
import type { GeneralKnowledgeItem } from "./KnowledgeGeneralCard";

interface KnowledgeViewerDrawerProps {
  item: GeneralKnowledgeItem | null;
  open: boolean;
  onClose: () => void;
  onEdit: (item: GeneralKnowledgeItem) => void;
  onDelete: (id: string) => void;
}

const KnowledgeViewerDrawer = ({ item, open, onClose, onEdit, onDelete }: KnowledgeViewerDrawerProps) => {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div>
            <SheetTitle className="text-foreground text-lg leading-tight mb-2">{item.title}</SheetTitle>
            <KnowledgeTypeBadge type={item.type} />
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Content */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Content</h4>
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {item.content}
              </pre>
            </div>
          </div>

          {item.url && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">URL Reference</h4>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                {item.url}
              </a>
            </div>
          )}

          {item.fileUrl && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">File Reference</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <code className="bg-muted px-2 py-1 rounded text-xs">{item.fileUrl}</code>
              </div>
            </div>
          )}

          <Separator className="bg-border" />

          {/* Metadata */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Metadata</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>ID: knowledge_{item.id}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated: {item.updatedAt}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => { onEdit(item); onClose(); }}>
              Edit Entry
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { onDelete(item.id); onClose(); }}
            >
              Delete Entry
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KnowledgeViewerDrawer;



