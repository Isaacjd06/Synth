"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextInputProps {
  value: string;
  onChange: (value: string) => void;
}

const exampleHints = [
  "Only do this for 'Paid' customers",
  "Skip anyone with missing emails",
  "Send me a weekly summary too",
  "Use formal language in messages",
  "Include timestamps in all logs",
];

const ContextInput = ({ value, onChange }: ContextInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-card border-border/50">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Additional Details
            <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-3 pt-0">
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add any details that will help Synth build this correctly."
                className="min-h-[80px] bg-muted/30 border-border/50 text-base resize-none"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Examples:</p>
                <ul className="space-y-1">
                  {exampleHints.map((hint, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                      <span className="text-primary">•</span>
                      "{hint}"
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ContextInput;



