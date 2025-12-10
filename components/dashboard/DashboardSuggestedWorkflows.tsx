import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Plus, Mail, MessageSquare, Users, CreditCard } from "lucide-react";

const suggestions = [
  { icon: Mail, title: "Send Follow-up Emails After Signup", description: "Automatically send a welcome sequence when new users register", trigger: "New User Signup" },
  { icon: MessageSquare, title: "Slack Alert on Payment Failure", description: "Get instant notifications in Slack when a payment fails", trigger: "Stripe Payment Failed" },
  { icon: Users, title: "Log Users in CRM on Upgrade", description: "Add or update CRM records when users upgrade their plan", trigger: "Subscription Upgraded" },
  { icon: CreditCard, title: "Invoice Reminder Automation", description: "Send automated reminders for unpaid invoices", trigger: "Invoice Overdue" },
];

const DashboardSuggestedWorkflows = () => {
  return (
    <Card className="bg-card border-border/50 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Suggested New Workflows</h2>
        <span className="text-xs text-muted-foreground ml-auto">Based on your activity patterns</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <suggestion.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">{suggestion.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                <span className="text-[10px] text-primary mt-2 inline-block">Trigger: {suggestion.trigger}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Create Workflow
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DashboardSuggestedWorkflows;



