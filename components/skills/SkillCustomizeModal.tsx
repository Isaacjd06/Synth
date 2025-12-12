"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings2, MessageSquare, Save, X, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { synthToast } from "@/lib/synth-toast";
import type { PrebuiltSkill } from "./SkillCard";

interface SkillCustomizeModalProps {
  skill: PrebuiltSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (skill: PrebuiltSkill, updates: Partial<PrebuiltSkill>) => void;
  onOpenChat: (skill: PrebuiltSkill) => void;
}

export const SkillCustomizeModal = ({
  skill,
  open,
  onOpenChange,
  onSave,
  onOpenChat,
}: SkillCustomizeModalProps) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when skill changes
  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setIsEnabled(skill.isEnabled);
    }
  }, [skill]);

  const handleSave = async () => {
    if (!skill) return;
    
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSave(skill, { name, description, isEnabled });
    synthToast.success("Skill Updated", `"${name}" has been updated successfully.`);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleOpenChat = () => {
    if (!skill) return;
    onOpenChange(false);
    onOpenChat(skill);
  };

  if (!skill) return null;

  const IconComponent = skill.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">Customize Skill</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Modify settings for this automation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
            {skill.isEnabled && (
              <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Active
              </Badge>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="skill-name" className="text-sm font-medium">
              Skill Name
            </Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter skill name"
              className="bg-muted/30 border-border/60 focus:border-primary/50"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="skill-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this skill does"
              rows={3}
              className="bg-muted/30 border-border/60 focus:border-primary/50 resize-none"
            />
          </div>

          {/* Workflow Preview (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Workflow Preview</Label>
            <div className="px-3 py-2.5 rounded-lg bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground font-mono">{skill.preview}</p>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 border border-border/40">
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Enable Skill</p>
                <p className="text-xs text-muted-foreground">Activate this automation</p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Advanced Customization CTA */}
          <Button
            variant="outline"
            onClick={handleOpenChat}
            className="w-full border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Advanced Customization in Chat
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
