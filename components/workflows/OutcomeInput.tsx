import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutcomeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const OutcomeInput = ({ value, onChange, error }: OutcomeInputProps) => {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          What should Synth do?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Send me a Slack message with the customer's name and email. Also save them to HubSpot."
          className={cn(
            "min-h-[100px] bg-muted/30 border-border/50 text-base resize-none",
            error && "border-red-500/50"
          )}
        />
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Describe the end result. Synth will figure out the steps and apps needed.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default OutcomeInput;



