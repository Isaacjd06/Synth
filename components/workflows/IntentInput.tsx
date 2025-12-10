import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const promptSuggestions = [
  "Notify me when a payment succeeds",
  "Log every new form submission",
  "Send myself a summary every morning",
  "Add customers to Notion automatically",
  "Alert Slack when inventory is low",
  "Create a task when I get an email",
];

const IntentInput = ({ value, onChange, error }: IntentInputProps) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const handleSuggestionClick = (suggestion: string, index: number) => {
    onChange(suggestion);
    setSelectedSuggestion(index);
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Describe Your Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedSuggestion(null);
            }}
            placeholder="Example: When I get a new lead in Google Sheets, send me a Slack notification and add them to my CRM."
            className={cn(
              "min-h-[120px] bg-muted/30 border-border/50 text-base resize-none",
              error && "border-red-500/50"
            )}
          />
          {error ? (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Write in plain English. Synth will figure out the steps.
            </p>
          )}
        </div>

        {/* Prompt suggestions */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion, idx)}
                className={cn(
                  "text-xs h-8 bg-muted/20 border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all",
                  selectedSuggestion === idx && "bg-primary/20 border-primary/50 text-primary"
                )}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntentInput;



