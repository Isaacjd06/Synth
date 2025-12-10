"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"
import { Sparkles, Building2, User, Briefcase, Laptop, ArrowRight, ArrowLeft, Zap, Clock, TrendingUp, Workflow, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { synthToast } from "@/lib/synth-toast";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const roles = [
  { id: "founder", label: "Founder / Owner", icon: Building2 },
  { id: "agency", label: "Agency Operator", icon: Briefcase },
  { id: "freelancer", label: "Freelancer", icon: Laptop },
  { id: "sales", label: "Sales / Lead Gen", icon: TrendingUp },
  { id: "other", label: "Other", icon: User },
];

const goals = [
  { id: "leads", label: "Improve lead follow-ups", icon: TrendingUp },
  { id: "automate", label: "Automate repetitive tasks", icon: Zap },
  { id: "insights", label: "Get better insights", icon: Clock },
  { id: "workflows", label: "Build custom workflows", icon: Workflow },
  { id: "all", label: "All of the above", icon: CheckCircle },
];

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const router = useRouter();

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // In production, save to backend
      console.log("Onboarding complete:", { role: selectedRole, goal: selectedGoal });
      synthToast.success("Welcome to Synth!", "Your account is ready to go.");
      onComplete();
      router.push("/app/dashboard");
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSkip = () => {
    onComplete();
    router.push("/app/dashboard");
  };

  const canProceed = step === 1 ? !!selectedRole : !!selectedGoal;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl overflow-hidden [&>button]:hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        <DialogHeader className="relative">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
          >
            <Sparkles className="w-7 h-7 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
          </motion.div>
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
            {step === 1 ? "Tell us about your role" : "What is your main goal with Synth?"}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground font-light mt-2">
            {step === 1
              ? "This helps Synth personalize automation suggestions."
              : "We'll tailor your experience based on your needs."}
          </p>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 my-4">
          <div className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            step === 1 ? "bg-primary w-8" : "bg-muted-foreground/30 w-3"
          )} />
          <div className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            step === 2 ? "bg-primary w-8" : "bg-muted-foreground/30 w-3"
          )} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5 relative"
          >
            {step === 1 ? (
              /* Role Selection */
              roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    selectedRole === role.id
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.4)]"
                      : "bg-muted/20 border-border/50 hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    selectedRole === role.id ? "bg-primary/20 border border-primary/30" : "bg-muted/50 border border-border/50"
                  )}>
                    <role.icon className={cn(
                      "w-5 h-5 transition-colors",
                      selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn(
                    "font-medium transition-colors text-sm",
                    selectedRole === role.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {role.label}
                  </span>
                  {selectedRole === role.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                  )}
                </button>
              ))
            ) : (
              /* Goal Selection */
              goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    selectedGoal === goal.id
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.4)]"
                      : "bg-muted/20 border-border/50 hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    selectedGoal === goal.id ? "bg-primary/20 border border-primary/30" : "bg-muted/50 border border-border/50"
                  )}>
                    <goal.icon className={cn(
                      "w-5 h-5 transition-colors",
                      selectedGoal === goal.id ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn(
                    "font-medium transition-colors text-sm",
                    selectedGoal === goal.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {goal.label}
                  </span>
                  {selectedGoal === goal.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                  )}
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <div className="flex gap-3">
            {step === 2 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 border-border/50 hover:border-primary/30"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "bg-primary hover:bg-primary/90 gap-2",
                step === 1 ? "w-full" : "flex-1"
              )}
            >
              {step === 2 ? "Finish Setup" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;





