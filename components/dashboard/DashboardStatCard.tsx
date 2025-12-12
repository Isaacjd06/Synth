"use client";
import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

const DashboardStatCard = ({ label, value, icon: Icon }: DashboardStatCardProps) => {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light hover:border-primary/30 transition-all duration-300">
      {/* Hover glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label} metric</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-3xl font-display font-bold text-foreground mb-1.5">
          {value}
        </p>
        <p className="text-sm text-muted-foreground font-light">
          {label}
        </p>
      </CardContent>
    </Card>
  );
};

export default DashboardStatCard;
