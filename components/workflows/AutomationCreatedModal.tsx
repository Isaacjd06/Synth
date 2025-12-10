"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"
import { CheckCircle2, Zap, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { synthToast } from "@/lib/synth-toast";

interface AutomationCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: {
    id: string;
    name: string;
    description: string;
    trigger: string;
    actions: string[];
  };
}

const AutomationCreatedModal = ({
  open,
  onOpenChange,
  workflow,
}: AutomationCreatedModalProps) => {
  const [isActive, setIsActive] = useState(true);
  const router = useRouter();

  const handleViewWorkflow = () => {
    synthToast.workflowCreated(workflow.name);
    onOpenChange(false);
    router.push(`/app/workflows/${workflow.id}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md glass-strong border-primary/20 overflow-hidden">
            {/* Success Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <DialogHeader className="relative">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_40px_-5px_hsl(217_100%_60%/0.5)]"
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <DialogTitle className="text-center text-xl text-gradient">
                  Automation Created
                </DialogTitle>
              </motion.div>
            </DialogHeader>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-5 mt-4 relative"
            >
              {/* Workflow Name & Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-lg">
                  {workflow.name}
                </h3>
                <p className="text-sm text-muted-foreground font-light">
                  {workflow.description}
                </p>
              </div>

              {/* Trigger Preview */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                  <Zap className="w-3 h-3 text-primary" />
                  Trigger
                </div>
                <p className="text-sm text-foreground">{workflow.trigger}</p>
              </div>

              {/* Actions Preview */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Actions ({workflow.actions.length})
                </div>
                <div className="space-y-1.5">
                  {workflow.actions.slice(0, 3).map((action, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-foreground">{action}</span>
                    </div>
                  ))}
                  {workflow.actions.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-7">
                      +{workflow.actions.length - 3} more actions
                    </p>
                  )}
                </div>
              </div>

              {/* Activation Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Activate Workflow
                  </p>
                  <p className="text-xs text-muted-foreground font-light">
                    Start running this automation immediately
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Action Button */}
              <Button
                onClick={handleViewWorkflow}
                className="w-full btn-synth gap-2"
              >
                View Workflow
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AutomationCreatedModal;





