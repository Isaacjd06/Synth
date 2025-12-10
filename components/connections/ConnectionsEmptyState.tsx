import { Link2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConnectionsEmptyStateProps {
  onConnect: () => void;
}

const ConnectionsEmptyState = ({ onConnect }: ConnectionsEmptyStateProps) => {
  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Plug className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Connections Yet
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
        Connect apps so Synth can automate your workflows across all your favorite tools.
      </p>
      <Button onClick={onConnect} size="lg">
        <Link2 className="w-4 h-4 mr-2" />
        Connect Your First App
      </Button>
    </Card>
  );
};

export default ConnectionsEmptyState;



