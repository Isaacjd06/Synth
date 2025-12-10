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
import { Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowFiltersProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const WorkflowFilters = ({ viewMode, onViewModeChange }: WorkflowFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            className="pl-9 bg-muted/30 border-border/50 h-9"
          />
        </div>

        {/* Status Filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/30 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {/* Trigger Filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/30 border-border/50">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="schedule">Schedule</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="form">Form</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select defaultValue="recent">
          <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/30 border-border/50">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name-asc">Name A→Z</SelectItem>
            <SelectItem value="name-desc">Name Z→A</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
            <SelectItem value="executions">Most Executions</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border border-border/50 rounded-md p-0.5 bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              viewMode === "grid" && "bg-primary/20 text-primary"
            )}
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              viewMode === "list" && "bg-primary/20 text-primary"
            )}
            onClick={() => onViewModeChange("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowFilters;



