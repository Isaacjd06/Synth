import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Clock, Zap, Hand, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type TriggerOption = 
  | "event" 
  | "schedule" 
  | "manual" 
  | "once" 
  | "condition";

interface TriggerSelectorProps {
  selectedTrigger: TriggerOption;
  onTriggerChange: (trigger: TriggerOption) => void;
  eventDescription: string;
  onEventDescriptionChange: (value: string) => void;
  scheduleTime: string;
  onScheduleTimeChange: (value: string) => void;
  scheduleFrequency: string;
  onScheduleFrequencyChange: (value: string) => void;
}

const triggerOptions = [
  { 
    value: "event" as TriggerOption, 
    label: "Whenever something happens", 
    icon: Zap,
    description: "Run when an event triggers it"
  },
  { 
    value: "schedule" as TriggerOption, 
    label: "On a schedule", 
    icon: Clock,
    description: "Run at specific times"
  },
  { 
    value: "manual" as TriggerOption, 
    label: "When I manually trigger it", 
    icon: Hand,
    description: "Run only when you start it"
  },
  { 
    value: "once" as TriggerOption, 
    label: "Only once", 
    icon: Calendar,
    description: "Run one time only"
  },
  { 
    value: "condition" as TriggerOption, 
    label: "Based on conditions I describe", 
    icon: Filter,
    description: "Run when conditions are met"
  },
];

const TriggerSelector = ({
  selectedTrigger,
  onTriggerChange,
  eventDescription,
  onEventDescriptionChange,
  scheduleTime,
  onScheduleTimeChange,
  scheduleFrequency,
  onScheduleFrequencyChange,
}: TriggerSelectorProps) => {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          When should this run?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trigger options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {triggerOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onTriggerChange(option.value)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  selectedTrigger === option.value
                    ? "bg-primary/10 border-primary/50"
                    : "bg-muted/20 border-border/50 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn(
                    "w-4 h-4",
                    selectedTrigger === option.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    selectedTrigger === option.value ? "text-foreground" : "text-foreground/80"
                  )}>
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{option.description}</p>
              </button>
            );
          })}
        </div>

        {/* Schedule options */}
        {selectedTrigger === "schedule" && (
          <div className="pt-4 border-t border-border/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => onScheduleTimeChange(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={onScheduleFrequencyChange}>
                  <SelectTrigger className="bg-muted/30 border-border/50">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Event description */}
        {(selectedTrigger === "event" || selectedTrigger === "condition") && (
          <div className="pt-4 border-t border-border/30">
            <Label className="text-sm mb-2 block">
              {selectedTrigger === "event" 
                ? "Describe the event that starts this automation:" 
                : "Describe the conditions:"}
            </Label>
            <Input
              value={eventDescription}
              onChange={(e) => onEventDescriptionChange(e.target.value)}
              placeholder={
                selectedTrigger === "event"
                  ? "e.g., When I receive a new email from a customer"
                  : "e.g., Only when the order total is above $100"
              }
              className="bg-muted/30 border-border/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TriggerSelector;



