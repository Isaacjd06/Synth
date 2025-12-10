"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Brain, ChevronDown, ChevronUp } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import AppCard from "@/components/app/AppCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type ContextType = "preference" | "reasoning" | "pattern" | "workflow_decision" | "user_behavior";

interface Memory {
  id: string;
  context_type: ContextType;
  content: string | Record<string, unknown>;
  relevance_score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_accessed: string | null;
}

const mockMemories: Memory[] = [
  {
    id: "1",
    context_type: "preference",
    content: "User prefers email notifications over Slack for urgent matters",
    relevance_score: 0.95,
    metadata: { source: "chat", confidence: "high" },
    created_at: "2025-01-15T10:00:00Z",
    last_accessed: "2025-01-15T14:30:00Z",
  },
  {
    id: "2",
    context_type: "workflow_decision",
    content: { decision: "route_to_slack", reason: "Team prefers real-time notifications", workflow_id: "wf_123" },
    relevance_score: 0.88,
    metadata: null,
    created_at: "2025-01-14T09:00:00Z",
    last_accessed: null,
  },
  {
    id: "3",
    context_type: "pattern",
    content: "Most new leads come in between 9am-11am EST on weekdays",
    relevance_score: 0.75,
    metadata: { data_source: "executions", sample_size: 150 },
    created_at: "2025-01-10T12:00:00Z",
    last_accessed: "2025-01-15T08:00:00Z",
  },
];

const contextTypeColors: Record<ContextType, string> = {
  preference: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reasoning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pattern: "bg-green-500/20 text-green-400 border-green-500/30",
  workflow_decision: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  user_behavior: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>(mockMemories);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [contextType, setContextType] = useState<ContextType>("preference");
  const [content, setContent] = useState("");
  const [relevanceScore, setRelevanceScore] = useState("");
  const [metadata, setMetadata] = useState("");

  const resetForm = () => {
    setContextType("preference");
    setContent("");
    setRelevanceScore("");
    setMetadata("");
  };

  const handleAdd = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    let parsedContent: string | Record<string, unknown> = content.trim();
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // Keep as string
    }

    let parsedMetadata: Record<string, unknown> | null = null;
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        toast.error("Invalid metadata JSON");
        setIsLoading(false);
        return;
      }
    }

    const newMemory: Memory = {
      id: crypto.randomUUID(),
      context_type: contextType,
      content: parsedContent,
      relevance_score: relevanceScore ? parseFloat(relevanceScore) : null,
      metadata: parsedMetadata,
      created_at: new Date().toISOString(),
      last_accessed: null,
    };

    setMemories([newMemory, ...memories]);
    setIsAddOpen(false);
    resetForm();
    setIsLoading(false);
    toast.success("Memory entry created successfully");
  };

  const handleEdit = async () => {
    if (!selectedMemory || !content.trim()) return;

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    let parsedContent: string | Record<string, unknown> = content.trim();
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // Keep as string
    }

    let parsedMetadata: Record<string, unknown> | null = null;
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        toast.error("Invalid metadata JSON");
        setIsLoading(false);
        return;
      }
    }

    setMemories(memories.map(m =>
      m.id === selectedMemory.id
        ? {
            ...m,
            context_type: contextType,
            content: parsedContent,
            relevance_score: relevanceScore ? parseFloat(relevanceScore) : null,
            metadata: parsedMetadata,
          }
        : m
    ));
    setIsEditOpen(false);
    setSelectedMemory(null);
    resetForm();
    setIsLoading(false);
    toast.success("Memory entry updated successfully");
  };

  const handleDelete = async () => {
    if (!selectedMemory) return;

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));

    setMemories(memories.filter(m => m.id !== selectedMemory.id));
    setIsDeleteOpen(false);
    setSelectedMemory(null);
    setIsLoading(false);
    toast.success("Memory entry deleted successfully");
  };

  const openEditDialog = (memory: Memory) => {
    setSelectedMemory(memory);
    setContextType(memory.context_type);
    setContent(typeof memory.content === "string" ? memory.content : JSON.stringify(memory.content, null, 2));
    setRelevanceScore(memory.relevance_score?.toString() || "");
    setMetadata(memory.metadata ? JSON.stringify(memory.metadata, null, 2) : "");
    setIsEditOpen(true);
  };

  const getContentPreview = (content: string | Record<string, unknown>) => {
    if (typeof content === "string") {
      return content.length > 100 ? content.slice(0, 100) + "..." : content;
    }
    const str = JSON.stringify(content);
    return str.length > 100 ? str.slice(0, 100) + "..." : str;
  };

  return (
    <AppShell>
      <div className="px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Memory
          </h1>
          <p className="text-sm text-muted-foreground">Synth's learned context and patterns.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>

      {/* Memory List */}
      {memories.length === 0 ? (
        <AppCard>
          <p className="text-muted-foreground text-center py-8">
            No memory entries yet. Synth will learn from your interactions.
          </p>
        </AppCard>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <AppCard key={memory.id} className="p-4">
              <div
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === memory.id ? null : memory.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={contextTypeColors[memory.context_type]}>
                      {memory.context_type.replace("_", " ")}
                    </Badge>
                    {memory.relevance_score !== null && (
                      <span className="text-xs text-muted-foreground">
                        Score: {memory.relevance_score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{getContentPreview(memory.content)}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {formatDate(memory.created_at)}
                    {memory.last_accessed && ` · Last accessed: ${formatDate(memory.last_accessed)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(memory); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setSelectedMemory(memory); setIsDeleteOpen(true); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedId === memory.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedId === memory.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Full Content</h4>
                    <pre className="bg-background/40 p-3 rounded-lg text-xs font-mono text-foreground overflow-x-auto">
                      {typeof memory.content === "string" ? memory.content : JSON.stringify(memory.content, null, 2)}
                    </pre>
                  </div>
                  {memory.metadata && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Metadata</h4>
                      <pre className="bg-background/40 p-3 rounded-lg text-xs font-mono text-foreground overflow-x-auto">
                        {JSON.stringify(memory.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AppCard>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Memory Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Context Type *</Label>
              <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                  <SelectItem value="pattern">Pattern</SelectItem>
                  <SelectItem value="workflow_decision">Workflow Decision</SelectItem>
                  <SelectItem value="user_behavior">User Behavior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content * (text or JSON)</Label>
              <Textarea
                id="content"
                placeholder="Enter content as text or valid JSON object"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relevanceScore">Relevance Score (0-1)</Label>
              <Input
                id="relevanceScore"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="e.g., 0.85"
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (optional JSON)</Label>
              <Textarea
                id="metadata"
                placeholder='{"source": "chat", "confidence": "high"}'
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                className="min-h-[60px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!content.trim() || isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Memory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Memory Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Context Type *</Label>
              <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                  <SelectItem value="pattern">Pattern</SelectItem>
                  <SelectItem value="workflow_decision">Workflow Decision</SelectItem>
                  <SelectItem value="user_behavior">User Behavior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContent">Content *</Label>
              <Textarea
                id="editContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRelevanceScore">Relevance Score (0-1)</Label>
              <Input
                id="editRelevanceScore"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMetadata">Metadata (optional JSON)</Label>
              <Textarea
                id="editMetadata"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                className="min-h-[60px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!content.trim() || isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memory Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppShell>
  );
}

