import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExecutionFiltersProps {
  workflows: Array<{ id: string; name: string }>;
}

const ExecutionFilters = ({ workflows }: ExecutionFiltersProps) => {
  const [date, setDate] = useState<Date>();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search executions..."
          className="pl-9 bg-muted/30 border-border/50 h-9"
        />
      </div>

      {/* Status Filter */}
      <Select defaultValue="all">
        <SelectTrigger className="w-full sm:w-[130px] h-9 bg-muted/30 border-border/50">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="running">Running</SelectItem>
        </SelectContent>
      </Select>

      {/* Workflow Filter */}
      <Select defaultValue="all">
        <SelectTrigger className="w-full sm:w-[160px] h-9 bg-muted/30 border-border/50">
          <SelectValue placeholder="Workflow" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all">All Workflows</SelectItem>
          {workflows.map((wf) => (
            <SelectItem key={wf.id} value={wf.id}>
              {wf.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[180px] h-9 justify-start text-left font-normal bg-muted/30 border-border/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <Select defaultValue="recent">
        <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/30 border-border/50">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="duration">Longest Duration</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ExecutionFilters;



