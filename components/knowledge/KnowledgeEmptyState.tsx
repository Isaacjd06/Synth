import { BookOpen, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KnowledgeEmptyStateProps {
  onCreateEntry: () => void;
}

const KnowledgeEmptyState = ({ onCreateEntry }: KnowledgeEmptyStateProps) => {
  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-primary/10">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Knowledge Added
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
        Add documentation, rules, or processes that Synth can use during workflow generation.
      </p>
      <Button onClick={onCreateEntry} size="lg">
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Entry
      </Button>
    </Card>
  );
};

export default KnowledgeEmptyState;



