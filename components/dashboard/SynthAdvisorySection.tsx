import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdvisoryItem from "./AdvisoryItem";

// Placeholder data - will be replaced with API data
const placeholderAdvisory = [
  {
    id: "1",
    title: "Optimize your Slack notification workflow",
    description: "Batching notifications could reduce API calls by 60% and improve delivery speed.",
    priority: "high" as const,
    category: "optimization" as const,
  },
  {
    id: "2",
    title: "2 inactive workflows detected",
    description: "The 'Legacy Data Sync' and 'Old Email Router' workflows haven't run in 30+ days. Consider archiving or updating them.",
    priority: "medium" as const,
    category: "unused" as const,
  },
  {
    id: "3",
    title: "Suggested new workflow",
    description: "Based on your patterns, Synth can create an automated invoice reminder system that integrates with your billing tools.",
    priority: "low" as const,
    category: "suggestion" as const,
  },
  {
    id: "4",
    title: "You saved 14 hours this week",
    description: "Your automations processed 1,247 tasks that would have taken an estimated 14 hours manually.",
    priority: "low" as const,
    category: "productivity" as const,
  },
  {
    id: "5",
    title: "Consider consolidating duplicate workflows",
    description: "Three of your workflows perform similar email parsing. Merging them could simplify maintenance.",
    priority: "medium" as const,
    category: "optimization" as const,
  },
  {
    id: "6",
    title: "System optimization available",
    description: "Consider disabling inactive workflows to improve dashboard performance and reduce clutter.",
    priority: "low" as const,
    category: "system" as const,
  },
];

const SynthAdvisorySection = () => {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Synth Advisory
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered insights and recommendations for your automations
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {placeholderAdvisory.map((item) => (
              <AdvisoryItem
                key={item.id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                category={item.category}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SynthAdvisorySection;



