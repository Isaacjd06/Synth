"use client";
import { useState } from "react";
import Link from "next/link";
import { Lightbulb, ChevronDown, ChevronUp, ArrowRight, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DashboardSuggestionCardProps {
  isEmpty?: boolean;
}

const DashboardSuggestionCard = ({ isEmpty = false }: DashboardSuggestionCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Hidden empty state - will be shown when isEmpty is true (wired by backend later)
  if (isEmpty) {
    return (
      <Card className="hidden relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="py-12 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-light">Synth has no suggestions right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Synth Suggestion
              </CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="pt-0 pb-6 relative space-y-5">
            <p className="text-sm text-muted-foreground font-light">
              Based on your recent activity, Synth has identified a workflow improvement opportunity.
            </p>
            
            <div className="p-5 rounded-xl bg-synth-surface-light/50 border border-border/40">
              <h4 className="text-base font-semibold text-foreground mb-2">
                Optimize Lead Response Time
              </h4>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                Automating lead responses could reduce your average reply time by 73%.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button className="bg-primary hover:bg-primary/90 btn-synth">
                Apply
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/app/chat">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Ask Synth
                </Link>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DashboardSuggestionCard;

