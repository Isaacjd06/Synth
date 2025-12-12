"use client";
import Link from "next/link";
import { Lock, MessageSquare, PlaySquare, ChevronRight, Zap, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface PrebuiltSkill {
  id: string;
  name: string;
  description: string;
  preview: string;
  icon: LucideIcon;
  category: string;
  isEnabled: boolean;
  runsCount: number;
  requiredPlan?: "starter" | "pro" | "agency";
}

interface SkillCardProps {
  skill: PrebuiltSkill;
  isSubscribed: boolean;
  userPlan?: string;
  onToggle: (id: string) => void;
  onCustomize: (skill: PrebuiltSkill) => void;
  onViewRuns: (skill: PrebuiltSkill) => void;
  isToggling?: boolean;
  index?: number;
}

const PLAN_LEVELS: Record<string, number> = {
  starter: 1,
  pro: 2,
  agency: 3,
};

export const SkillCard = ({
  skill,
  isSubscribed,
  userPlan = "starter",
  onToggle,
  onCustomize,
  onViewRuns,
  isToggling,
  index = 0,
}: SkillCardProps) => {
  const requiredPlanLevel = PLAN_LEVELS[skill.requiredPlan || "starter"] || 1;
  const userPlanLevel = PLAN_LEVELS[userPlan] || 0;
  const isLocked = !isSubscribed || userPlanLevel < requiredPlanLevel;
  const needsUpgrade = isSubscribed && userPlanLevel < requiredPlanLevel;

  const IconComponent = skill.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="max-w-[600px]"
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200 h-full",
          "hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5",
          "border-border/50",
          skill.isEnabled && !isLocked
            ? "bg-gradient-to-br from-card to-card/90 border-primary/30 shadow-md shadow-primary/5"
            : "bg-card/80 hover:border-primary/25",
          isLocked && "hover:border-muted-foreground/20"
        )}
      >
        {/* Active glow effect */}
        {skill.isEnabled && !isLocked && (
          <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* Subtle hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="absolute inset-0 bg-primary/3" />
        </div>

        <CardContent className="p-4 sm:p-5 space-y-3 relative">
          {/* Header row - icon, badges, toggle/lock aligned */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                  skill.isEnabled && !isLocked
                    ? "bg-primary/12 border border-primary/30"
                    : "bg-muted/40 border border-border/50"
                )}
              >
                <IconComponent
                  className={cn(
                    "w-4.5 h-4.5 transition-colors",
                    skill.isEnabled && !isLocked ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              
              {/* Category & Plan badges - vertically centered with icon */}
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant="secondary" 
                  className="text-[11px] bg-secondary/50 text-secondary-foreground/80 px-2 py-0.5 font-medium"
                >
                  {skill.category}
                </Badge>
                {skill.requiredPlan && skill.requiredPlan !== "starter" && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] px-2 py-0.5 font-medium",
                      skill.requiredPlan === "pro"
                        ? "border-blue-500/30 text-blue-400 bg-blue-500/8"
                        : "border-cyan-500/30 text-cyan-400 bg-cyan-500/8"
                    )}
                  >
                    {skill.requiredPlan.charAt(0).toUpperCase() + skill.requiredPlan.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Toggle or Lock - consistent positioning */}
            <div className="shrink-0 ml-2">
              {!isLocked ? (
                <div className="relative flex items-center justify-center h-10">
                  <Switch
                    checked={skill.isEnabled}
                    onCheckedChange={() => onToggle(skill.id)}
                    disabled={isToggling}
                    className={cn(
                      "data-[state=checked]:bg-primary transition-opacity",
                      isToggling && "opacity-50"
                    )}
                  />
                  {isToggling && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-center cursor-not-allowed hover:bg-muted/50 transition-colors">
                      <Lock className="w-4.5 h-4.5 text-muted-foreground/70" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[180px]">
                    <p className="text-xs">
                      {needsUpgrade
                        ? `Upgrade to ${skill.requiredPlan?.charAt(0).toUpperCase()}${skill.requiredPlan?.slice(1)} to unlock`
                        : "Upgrade to unlock"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Active badge - inline with content flow */}
          {skill.isEnabled && !isLocked && (
            <Badge className="text-[11px] bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 px-2 py-0.5">
              Active
            </Badge>
          )}

          {/* Title & Description */}
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-foreground transition-colors leading-snug text-[15px]",
              !isLocked && "group-hover:text-primary"
            )}>
              {skill.name}
            </h3>
            <p className="text-sm text-muted-foreground font-light line-clamp-2 leading-relaxed">
              {skill.description}
            </p>
          </div>

          {/* Preview - controlled overflow */}
          <div className={cn(
            "px-3 py-2 rounded-md bg-muted/25 border border-border/40 transition-colors",
            !isLocked && "group-hover:border-primary/15 group-hover:bg-muted/35"
          )}>
            <p className="text-[11px] text-muted-foreground font-mono truncate leading-relaxed">
              {skill.preview}
            </p>
          </div>

          {/* Stats */}
          {skill.runsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Zap className="w-3.5 h-3.5 text-primary/60" />
              <span>{skill.runsCount.toLocaleString()} executions</span>
            </div>
          )}

          {/* Actions - evenly spaced */}
          <div className="flex gap-2 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isLocked && onCustomize(skill)}
                  disabled={isLocked}
                  className={cn(
                    "flex-1 h-9 border-border/50 text-sm transition-all",
                    isLocked 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  {isLocked && <Lock className="w-3 h-3 mr-1.5" />}
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Customize
                </Button>
              </TooltipTrigger>
              {isLocked && (
                <TooltipContent side="bottom">
                  <p className="text-xs">Upgrade to unlock</p>
                </TooltipContent>
              )}
            </Tooltip>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewRuns(skill)}
              className="flex-1 h-9 text-sm hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
              View Runs
              <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-60" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
