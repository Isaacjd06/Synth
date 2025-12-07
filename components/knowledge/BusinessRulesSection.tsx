"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Save, X, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Rule {
  id: string;
  content: string;
}

export default function BusinessRulesSection() {
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", content: "Never offer discounts greater than 20% without manager approval" },
    { id: "2", content: "Always respond to customer inquiries within 4 business hours" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newRuleContent, setNewRuleContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!newRuleContent.trim()) return;
    
    setIsSaving(true);
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setRules([...rules, { id: crypto.randomUUID(), content: newRuleContent.trim() }]);
    setNewRuleContent("");
    setIsAdding(false);
    setIsSaving(false);
  };

  const handleEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setEditContent(rule.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingId) return;
    
    setIsSaving(true);
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setRules(rules.map(r => r.id === editingId ? { ...r, content: editContent.trim() } : r));
    setEditingId(null);
    setEditContent("");
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    setRules(rules.filter(r => r.id !== id));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Business Rules
              </CardTitle>
              <CardDescription>
                Define strict constraints that Synth must always obey. These are high-priority 
                rules that govern how automations behave.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new rule form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-primary/50 rounded-lg p-4 bg-primary/5"
              >
                <Textarea
                  placeholder="Enter a new business rule..."
                  value={newRuleContent}
                  onChange={(e) => setNewRuleContent(e.target.value)}
                  className="min-h-[80px] mb-3"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setIsAdding(false); setNewRuleContent(""); }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAdd}
                    disabled={!newRuleContent.trim() || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save Rule
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rules count */}
          <div className="text-sm text-muted-foreground">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} defined
          </div>

          {/* Rules list */}
          <div className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No rules defined yet. Add your first business rule.
              </p>
            ) : (
              rules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5"
                >
                  {editingId === rule.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveEdit}
                          disabled={!editContent.trim() || isSaving}
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
                      <div className="flex items-start gap-3">
                        <span className="text-amber-500 font-medium text-sm mt-0.5">
                          #{index + 1}
                        </span>
                        <p className="text-foreground text-sm">{rule.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(rule)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule.id)}
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
}

