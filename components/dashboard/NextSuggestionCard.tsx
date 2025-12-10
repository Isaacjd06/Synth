"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Suggestion {
  title: string;
  description: string;
  action: string;
}

// Mock suggestion - in production this would come from an API
const currentSuggestion: Suggestion = {
  title: "Optimize Lead Response Time",
  description: "Based on your recent activity, automating lead responses could reduce your average response time by 73%.",
  action: "Create Lead Autoresponder",
};

const NextSuggestionCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <span className="text-gradient">Synth Suggestion</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div>
            <h4 className="font-medium text-foreground mb-1">
              {currentSuggestion.title}
            </h4>
            <p className="text-sm text-muted-foreground font-light">
              {currentSuggestion.description}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" className="btn-synth gap-1.5">
              Apply
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/chat" className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Ask Synth
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NextSuggestionCard;





