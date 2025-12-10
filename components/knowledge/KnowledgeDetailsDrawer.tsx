import { Pencil, Trash2, Copy, X, Calendar, Workflow, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import KnowledgeCategoryBadge from "./KnowledgeCategoryBadge";
import type { KnowledgeEntry } from "./KnowledgeCard";

interface KnowledgeDetailsDrawerProps {
  entry: KnowledgeEntry | null;
  open: boolean;
  onClose: () => void;
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
  onDuplicate: (entry: KnowledgeEntry) => void;
}

const KnowledgeDetailsDrawer = ({
  entry,
  open,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: KnowledgeDetailsDrawerProps) => {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-foreground text-lg leading-tight mb-2">
                {entry.title}
              </SheetTitle>
              <KnowledgeCategoryBadge category={entry.category} />
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated {entry.lastUpdated}
          </p>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Content Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Content</h4>
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Metadata Section */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Metadata</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created on {entry.createdAt}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Last updated {entry.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Workflow className="w-4 h-4" />
                <span>Used by {entry.usedByWorkflows} workflows</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>
                  {entry.referencedInChat ? "Referenced in chat" : "Not referenced in chat yet"}
                </span>
              </div>
            </div>
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Entry
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onDuplicate(entry)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Entry
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Entry
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KnowledgeDetailsDrawer;



