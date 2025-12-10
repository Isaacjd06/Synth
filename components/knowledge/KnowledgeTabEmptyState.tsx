import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KnowledgeTabEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
}

const KnowledgeTabEmptyState = ({ icon: Icon, title, description, buttonLabel, onAction }: KnowledgeTabEmptyStateProps) => {
  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">{description}</p>
      <Button onClick={onAction}>{buttonLabel}</Button>
    </Card>
  );
};

export default KnowledgeTabEmptyState;



