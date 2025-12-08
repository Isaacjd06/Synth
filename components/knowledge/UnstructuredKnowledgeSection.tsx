"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Clock, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function UnstructuredKnowledgeSection() {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (content) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content]);

  // Load existing unstructured knowledge on mount
  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        const response = await fetch("/api/knowledge");
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.items) {
            // Find unstructured knowledge item (type: "text" or "markdown")
            const unstructuredItem = data.items.find(
              (item: { type: string; title: string }) =>
                item.type === "text" || item.type === "markdown" || item.title === "Unstructured Knowledge"
            );
            if (unstructuredItem?.content) {
              setContent(unstructuredItem.content);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load knowledge:", error);
      }
    };
    loadKnowledge();
  }, []);

  const handleAutoSave = async () => {
    if (!content.trim()) return;
    
    setSaveStatus('saving');
    try {
      // Check if we have an existing unstructured knowledge item
      const response = await fetch("/api/knowledge");
      let existingId: string | null = null;
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.items) {
          const existing = data.items.find(
            (item: { type: string; title: string }) =>
              item.type === "text" || item.type === "markdown" || item.title === "Unstructured Knowledge"
          );
          existingId = existing?.id || null;
        }
      }

      if (existingId) {
        // Update existing
        const updateResponse = await fetch(`/api/knowledge/${existingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Unstructured Knowledge",
            type: "markdown",
            content: content,
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error("Failed to save");
        }
      } else {
        // Create new
        const createResponse = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Unstructured Knowledge",
            type: "markdown",
            content: content,
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to save");
        }
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus('error');
    }
  };

  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      // Check if we have an existing unstructured knowledge item
      const response = await fetch("/api/knowledge");
      let existingId: string | null = null;
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.items) {
          const existing = data.items.find(
            (item: { type: string; title: string }) =>
              item.type === "text" || item.type === "markdown" || item.title === "Unstructured Knowledge"
          );
          existingId = existing?.id || null;
        }
      }

      if (existingId) {
        // Update existing
        const updateResponse = await fetch(`/api/knowledge/${existingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Unstructured Knowledge",
            type: "markdown",
            content: content,
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error("Failed to save");
        }
      } else {
        // Create new
        const createResponse = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Unstructured Knowledge",
            type: "markdown",
            content: content,
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to save");
        }
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus('error');
    }
  };

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <Check className="w-3 h-3" />
            Saved
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-destructive text-sm">
            <AlertCircle className="w-3 h-3" />
            Error saving
          </span>
        );
      default:
        return lastSaved ? (
          <span className="text-muted-foreground text-sm">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        ) : null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Unstructured Knowledge</CardTitle>
          <CardDescription>
            Enter business processes, SOPs, preferences, writing style notes, sales scripts, 
            follow-up sequences, onboarding instructions, customer support guidelines, 
            and any detailed background information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Start typing your notes here...

Examples of what you can include:
• Business processes and SOPs
• Sales scripts and follow-up sequences
• Customer support guidelines
• Writing style preferences
• Onboarding instructions
• Product documentation
• FAQs and common responses
• Any other detailed information..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm resize-y"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getSaveStatusDisplay()}
              <span className="text-xs text-muted-foreground">
                {content.length} characters
              </span>
            </div>
            
            <Button 
              onClick={handleManualSave} 
              disabled={saveStatus === 'saving' || !content.trim()}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Auto-saves after 3 seconds of inactivity. Your notes are stored securely and 
            integrated into Synth's memory system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

