"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Save, X, BookOpen, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

const GlossarySection = () => {
  const [entries, setEntries] = useState<GlossaryEntry[]>([
    { id: "1", term: "ICP", definition: "Ideal Customer Profile - A description of the type of company or individual that would benefit most from your product or service." },
    { id: "2", term: "MRR", definition: "Monthly Recurring Revenue - The predictable monthly revenue from subscriptions." },
    { id: "3", term: "CAC", definition: "Customer Acquisition Cost - The total cost of acquiring a new customer." },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDefinition, setEditDefinition] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sort entries alphabetically
  const sortedEntries = [...entries].sort((a, b) => 
    a.term.toLowerCase().localeCompare(b.term.toLowerCase())
  );

  // Filter entries by search term
  const filteredEntries = sortedEntries.filter(entry =>
    entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setEntries([...entries, { 
      id: crypto.randomUUID(), 
      term: newTerm.trim(), 
      definition: newDefinition.trim() 
    }]);
    setNewTerm("");
    setNewDefinition("");
    setIsAdding(false);
    setIsSaving(false);
  };

  const handleEdit = (entry: GlossaryEntry) => {
    setEditingId(entry.id);
    setEditTerm(entry.term);
    setEditDefinition(entry.definition);
  };

  const handleSaveEdit = async () => {
    if (!editTerm.trim() || !editDefinition.trim() || !editingId) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setEntries(entries.map(e => 
      e.id === editingId 
        ? { ...e, term: editTerm.trim(), definition: editDefinition.trim() } 
        : e
    ));
    setEditingId(null);
    setEditTerm("");
    setEditDefinition("");
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTerm("");
    setEditDefinition("");
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setEntries(entries.filter(e => e.id !== id));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-primary" />
                Glossary
              </CardTitle>
              <CardDescription>
                Define specialized terms and acronyms to help Synth understand your business language.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Term
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms or definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Add new term form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-primary/50 rounded-lg p-4 bg-primary/5 space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="newTerm">Term</Label>
                  <Input
                    id="newTerm"
                    placeholder="e.g., LTV, Churn, Pipeline"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDefinition">Definition</Label>
                  <Textarea
                    id="newDefinition"
                    placeholder="Explain what this term means..."
                    value={newDefinition}
                    onChange={(e) => setNewDefinition(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setIsAdding(false); setNewTerm(""); setNewDefinition(""); }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAdd}
                    disabled={!newTerm.trim() || !newDefinition.trim() || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save Term
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entry count */}
          <div className="text-sm text-muted-foreground">
            {filteredEntries.length} term{filteredEntries.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          {/* Entries list */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? "No matching terms found." : "No terms defined yet. Add your first glossary term."}
              </p>
            ) : (
              filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  {editingId === entry.id ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Term</Label>
                        <Input
                          value={editTerm}
                          onChange={(e) => setEditTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Definition</Label>
                        <Textarea
                          value={editDefinition}
                          onChange={(e) => setEditDefinition(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveEdit}
                          disabled={!editTerm.trim() || !editDefinition.trim() || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">{entry.term}</h4>
                        <p className="text-sm text-muted-foreground">{entry.definition}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlossarySection;




