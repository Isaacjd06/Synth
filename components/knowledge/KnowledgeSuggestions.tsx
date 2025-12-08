"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, X, BookOpen, Link2, AlertTriangle, 
  Workflow, ChevronDown, ChevronUp 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  id: string;
  type: 'definition' | 'connection' | 'rule' | 'workflow';
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  priority?: string;
}

export default function KnowledgeSuggestions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/knowledge/suggestions");
      const data = await response.json();
      
      if (data.ok && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'definition':
        return <BookOpen className="w-4 h-4" />;
      case 'connection':
        return <Link2 className="w-4 h-4" />;
      case 'rule':
        return <AlertTriangle className="w-4 h-4" />;
      case 'workflow':
        return <Workflow className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'definition':
        return 'bg-blue-500/20 text-blue-400';
      case 'connection':
        return 'bg-green-500/20 text-green-400';
      case 'rule':
        return 'bg-amber-500/20 text-amber-400';
      case 'workflow':
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  return (
    <Card className="border-border bg-card sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Suggestions
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {suggestions.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-3 pt-0">
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No suggestions at this time. Keep adding knowledge!
                </p>
              ) : (
                suggestions.map(suggestion => (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative border border-border rounded-lg p-3 group"
                  >
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>

                    <div className="flex items-start gap-2 mb-2">
                      <div className={`p-1.5 rounded ${getTypeColor(suggestion.type)}`}>
                        {getIcon(suggestion.type)}
                      </div>
                      <h4 className="text-sm font-medium text-foreground pr-6">
                        {suggestion.title}
                      </h4>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>

                    {suggestion.actionLabel && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => {
                          if (suggestion.actionLink) {
                            router.push(suggestion.actionLink);
                          }
                        }}
                      >
                        {suggestion.actionLabel}
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

