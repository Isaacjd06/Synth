import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SynthUpdateItem, { UpdateType } from "./SynthUpdateItem";

// Placeholder data - will be replaced with API data
const placeholderUpdates: Array<{
  id: string;
  type: UpdateType;
  title: string;
  description: string;
  timestamp: string;
}> = [
  {
    id: "1",
    type: "workflow",
    title: "New workflow created: Lead Intake → CRM",
    description: "Automatically routes new leads from your forms to Salesforce with smart field mapping.",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "ai",
    title: "Synth recommends optimizing Workflow X",
    description: "Your 'Email Parser' workflow could reduce execution time by 40% with parallel processing.",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "connection",
    title: "Google OAuth token expiring soon",
    description: "Your Google Workspace connection will expire in 3 days. Re-authenticate to maintain access.",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    type: "usage",
    title: "Most active workflow this week",
    description: "'New Lead Notifier' processed 847 events with a 99.2% success rate.",
    timestamp: "1 day ago",
  },
  {
    id: "5",
    type: "memory",
    title: "Synth learned your preferences",
    description: "Based on your patterns, Synth now defaults to JSON output format for API responses.",
    timestamp: "2 days ago",
  },
  {
    id: "6",
    type: "system",
    title: "Bug fix: Stripe webhook reliability improved",
    description: "We've improved retry logic for Stripe webhooks, reducing failed deliveries by 95%.",
    timestamp: "3 days ago",
  },
  {
    id: "7",
    type: "changelog",
    title: "New feature: Execution logs page",
    description: "You can now view detailed execution logs with filtering and search capabilities.",
    timestamp: "4 days ago",
  },
];

const SynthUpdatesSection = () => {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Synth Updates
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-green-500/10 text-green-400 border-green-500/30"
          >
            Operational
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Recent activity across your workflows and system
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[480px] pr-4">
          <div className="space-y-0">
            {placeholderUpdates.map((update, index) => (
              <div key={update.id}>
                <SynthUpdateItem
                  type={update.type}
                  title={update.title}
                  description={update.description}
                  timestamp={update.timestamp}
                />
                {index < placeholderUpdates.length - 1 && (
                  <Separator className="my-3 bg-border/30" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SynthUpdatesSection;



