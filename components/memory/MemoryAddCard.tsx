import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MemoryAddCardProps {
  onAdd: (title: string, description: string, category: string) => void;
}

const MemoryAddCard = ({ onAdd }: MemoryAddCardProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("preferences");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    
    onAdd(title.trim(), description.trim(), category);
    setTitle("");
    setDescription("");
    setCategory("preferences");
    setIsLoading(false);
  };

  return (
    <Card className="p-5 bg-card border-border mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          <Plus className="w-4 h-4 text-foreground" />
        </div>
        <h3 className="font-medium text-foreground">Add Custom Memory</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="memory-title">Memory Title</Label>
            <Input
              id="memory-title"
              placeholder="e.g., Prefers morning notifications"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preferences">General Preferences</SelectItem>
                <SelectItem value="workflows">Workflow Behaviors</SelectItem>
                <SelectItem value="apps">Connected Apps Insights</SelectItem>
                <SelectItem value="scheduling">Scheduling Patterns</SelectItem>
                <SelectItem value="formatting">Output Formatting</SelectItem>
                <SelectItem value="rules">Business Rules</SelectItem>
                <SelectItem value="habits">User Habits</SelectItem>
                <SelectItem value="data">Data Handling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="memory-description">Description</Label>
          <Textarea
            id="memory-description"
            placeholder="Describe the memory or preference in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-background border-border min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Examples: "Only do this for 'Paid' customers", "Skip anyone with missing emails"
          </p>
        </div>
        
        <Button onClick={handleAdd} disabled={!title.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default MemoryAddCard;



