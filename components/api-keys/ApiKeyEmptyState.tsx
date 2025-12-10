import { Key, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ApiKeyEmptyStateProps {
  onCreate: () => void;
}

const ApiKeyEmptyState = ({ onCreate }: ApiKeyEmptyStateProps) => {
  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Key className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No API Keys Yet
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
        Generate an API key to start using Synth programmatically.
      </p>
      <Button onClick={onCreate} size="lg">
        <Plus className="w-4 h-4 mr-2" />
        Generate API Key
      </Button>
    </Card>
  );
};

export default ApiKeyEmptyState;



