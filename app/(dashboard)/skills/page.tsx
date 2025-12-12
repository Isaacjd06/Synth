"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  MessageSquare,
  Mail,
  FileText,
  Bell,
  Users,
  ToggleLeft,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { synthToast } from "@/lib/synth-toast";
import { SkillCard, type PrebuiltSkill } from "@/components/skills/SkillCard";
import { SkillCustomizeModal } from "@/components/skills/SkillCustomizeModal";
import { SkillsLoadingState } from "@/components/skills/SkillsLoadingState";
import { Card, CardContent } from "@/components/ui/card";

const initialSkills: PrebuiltSkill[] = [
  {
    id: "1",
    name: "Lead Capture & CRM Sync",
    description: "Automatically capture leads from forms and sync to your CRM with enriched data.",
    preview: "When form submitted → Enrich data → Add to CRM → Notify sales",
    icon: Users,
    category: "Sales",
    isEnabled: true,
    runsCount: 142,
    requiredPlan: "starter",
  },
  {
    id: "2",
    name: "Email Summary Digest",
    description: "Summarize important emails and send daily/weekly digest notifications.",
    preview: "Daily at 8am → Scan inbox → Summarize key emails → Send digest",
    icon: Mail,
    category: "Productivity",
    isEnabled: false,
    runsCount: 0,
    requiredPlan: "starter",
  },
  {
    id: "3",
    name: "Document Processing",
    description: "Extract data from uploaded documents and organize in spreadsheets.",
    preview: "When file uploaded → Extract text → Parse fields → Update sheet",
    icon: FileText,
    category: "Operations",
    isEnabled: true,
    runsCount: 89,
    requiredPlan: "pro",
  },
  {
    id: "4",
    name: "Slack Alert Router",
    description: "Route alerts and notifications to appropriate Slack channels based on content.",
    preview: "When alert received → Classify urgency → Route to channel → Tag team",
    icon: Bell,
    category: "Communication",
    isEnabled: false,
    runsCount: 0,
    requiredPlan: "starter",
  },
  {
    id: "5",
    name: "Meeting Notes Generator",
    description: "Automatically generate and distribute meeting notes from recordings.",
    preview: "When meeting ends → Transcribe → Summarize → Send to attendees",
    icon: FileText,
    category: "Productivity",
    isEnabled: true,
    runsCount: 34,
    requiredPlan: "pro",
  },
  {
    id: "6",
    name: "Support Ticket Classifier",
    description: "Classify and route support tickets based on urgency and category.",
    preview: "When ticket created → Analyze content → Set priority → Assign agent",
    icon: Users,
    category: "Support",
    isEnabled: false,
    runsCount: 0,
    requiredPlan: "agency",
  },
];

const CATEGORIES = ["All", "Sales", "Productivity", "Operations", "Communication", "Support"];

export default function SkillsPage() {
  const [skills, setSkills] = useState<PrebuiltSkill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [customizeSkill, setCustomizeSkill] = useState<PrebuiltSkill | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const router = useRouter();
  const { isSubscribed, planTier, requireSubscription } = useSubscription();

  // Fetch skills from backend
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/skills");
        if (response.ok) {
          const data = await response.json();
          if (data.ok && Array.isArray(data.data)) {
            // Map backend Skill format to PrebuiltSkill format
            const iconMap: Record<string, any> = {
              Sales: Users,
              Productivity: FileText,
              Operations: Zap,
              Communication: MessageSquare,
              Support: Bell,
            };
            
            const mappedSkills: PrebuiltSkill[] = data.data.map((skill: any) => ({
              id: skill.id,
              name: skill.name,
              description: skill.description || "",
              preview: skill.stepsPreview || "",
              icon: iconMap[skill.category] || Users,
              category: skill.category || "Productivity",
              isEnabled: skill.active,
              runsCount: skill.executionCount || 0,
              requiredPlan: skill.requiredPlan || "starter",
            }));
            setSkills(mappedSkills);
          }
        } else {
          const errorData = await response.json();
          synthToast.error("Failed to load skills", errorData.error || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        synthToast.error("Error", "Failed to load skills");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Filter and group skills
  const { filteredSkills, groupedSkills } = useMemo(() => {
    const filtered =
      selectedCategory === "All"
        ? skills
        : skills.filter((s) => s.category === selectedCategory);

    // Group by category
    const groups: Record<string, PrebuiltSkill[]> = {};
    filtered.forEach((skill) => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }
      groups[skill.category].push(skill);
    });

    return { filteredSkills: filtered, groupedSkills: groups };
  }, [skills, selectedCategory]);

  const handleToggle = async (id: string) => {
    if (!requireSubscription("activate automations")) return;

    const skill = skills.find((s) => s.id === id);
    if (!skill) return;

    const willBeEnabled = !skill.isEnabled;
    
    // Optimistically update UI
    setTogglingId(id);
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: willBeEnabled } : s))
    );

    try {
      const endpoint = willBeEnabled 
        ? `/api/skills/${id}/activate`
        : `/api/skills/${id}/deactivate`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          if (willBeEnabled) {
            synthToast.skillEnabled(skill.name);
          } else {
            synthToast.skillDisabled(skill.name);
          }
        } else {
          throw new Error(data.error || "Failed to update skill");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update skill");
      }
    } catch (error) {
      // Roll back optimistic update
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isEnabled: !willBeEnabled } : s))
      );
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update skill";
      synthToast.error("Error", errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCustomize = (skill: PrebuiltSkill) => {
    if (!requireSubscription("customize skills")) return;
    setCustomizeSkill(skill);
    setIsCustomizeOpen(true);
  };

  const handleSaveCustomization = (skill: PrebuiltSkill, updates: Partial<PrebuiltSkill>) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? { ...s, ...updates } : s))
    );
  };

  const handleOpenChatForSkill = (skill: PrebuiltSkill) => {
    router.push(`/app/chat?prefill=${encodeURIComponent(`I want to customize the "${skill.name}" skill. ${skill.description}`)}`);
  };

  const handleViewRuns = (skill: PrebuiltSkill) => {
    router.push("/app/executions");
  };

  const enabledCount = skills.filter((s) => s.isEnabled).length;

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Subscription Banner */}
        {!isSubscribed && (
          <PageItem>
            <SubscriptionBanner feature="enable skills and automations" />
          </PageItem>
        )}

        {/* Header */}
        <PageItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              Prebuilt Skills
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base font-light">
              Turn on ready-made automations for your business.
            </p>
          </div>
          <Badge
            variant="outline"
            className="self-start px-3 py-1.5 border-primary/30 bg-primary/5 text-primary text-sm"
          >
            <ToggleLeft className="w-3.5 h-3.5 mr-1.5" />
            {enabledCount} Active
          </Badge>
        </PageItem>

        {/* Category Filter Bar */}
        <PageItem>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {CATEGORIES.map((category) => {
              const count = category === "All" 
                ? skills.length 
                : skills.filter(s => s.category === category).length;
              const isActive = selectedCategory === category;
              
              return (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted/40 text-muted-foreground border border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                  )}
                >
                  {category}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    isActive 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-background/50 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </PageItem>

        {/* Loading State */}
        {isLoading ? (
          <PageItem>
            <SkillsLoadingState />
          </PageItem>
        ) : filteredSkills.length === 0 ? (
          /* Empty State */
          <PageItem>
            <Card className="border-dashed border-2 border-border/50 bg-card/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {selectedCategory === "All" 
                    ? "No Prebuilt Skills Available" 
                    : `No ${selectedCategory} Skills`}
                </h3>
                <p className="text-muted-foreground mb-6 font-light max-w-md mx-auto text-sm">
                  {selectedCategory === "All"
                    ? "Your Synth account has no prebuilt skills yet. Create custom workflows in Chat."
                    : `No skills found in the ${selectedCategory} category. Try selecting a different filter.`}
                </p>
                {selectedCategory === "All" && (
                  <Button
                    onClick={() => router.push("/app/chat")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Custom Workflow
                  </Button>
                )}
              </CardContent>
            </Card>
          </PageItem>
        ) : (
          /* Skills by Category */
          <TooltipProvider delayDuration={200}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-8 pb-8"
              >
                {Object.entries(groupedSkills).map(([category, categorySkills], catIndex) => (
                  <PageItem key={category}>
                    {/* Category Header */}
                    {selectedCategory === "All" && (
                      <div className="flex items-center justify-between gap-4 mb-4 mt-6 first:mt-0">
                        <h4 className="text-base font-semibold text-foreground">
                          {category}
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 min-w-[40px] bg-gradient-to-r from-border/60 to-transparent" />
                          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md shrink-0">
                            {categorySkills.length} skill{categorySkills.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Skills Grid - 2 columns on desktop, 1 on mobile, max-width per card */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {categorySkills.map((skill, index) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          isSubscribed={isSubscribed}
                          userPlan={planTier}
                          onToggle={handleToggle}
                          onCustomize={handleCustomize}
                          onViewRuns={handleViewRuns}
                          isToggling={togglingId === skill.id}
                          index={index}
                        />
                      ))}
                    </div>
                  </PageItem>
                ))}
              </motion.div>
            </AnimatePresence>
          </TooltipProvider>
        )}
      </PageTransition>

      {/* Customize Modal */}
      <SkillCustomizeModal
        skill={customizeSkill}
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        onSave={handleSaveCustomization}
        onOpenChat={handleOpenChatForSkill}
      />
    </AppShell>
  );
}
