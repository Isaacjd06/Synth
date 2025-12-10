"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { googleSignIn } from "@/app/actions/auth";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/landing/GoogleSignInButton";

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_type: "",
    automation_goal: "",
    client_count: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one field is filled
    if (!formData.business_type && !formData.automation_goal && !formData.client_count) {
      toast.error("Please answer at least one question");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save onboarding data to temporary storage
      const response = await fetch("/api/onboarding/save-temp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save onboarding data");
      }

      toast.success("Onboarding data saved! Redirecting to sign in...");

      // After saving, redirect to Google sign-in
      // Small delay to ensure cookie is set
      setTimeout(async () => {
        try {
          await googleSignIn();
        } catch (error) {
          console.error("Error initiating Google sign-in:", error);
          toast.error("Failed to redirect to sign in. Please try again.");
          setIsSubmitting(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save onboarding data"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #050505 100%)" }}>
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }} />
      </div>

      {/* Soft blue radial glow */}
      <div className="absolute top-1/4 left-1/3 w-[800px] h-[800px] rounded-full opacity-20">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 50% / 0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="container relative z-10 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-display-bold text-foreground mb-4">
              Let's get started
            </h1>
            <p className="text-lg text-foreground/60">
              Help us understand your business so we can personalize your experience
            </p>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-b from-[#141414] to-[#0f0f0f] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl"
          >
            {/* Business Type */}
            <div className="mb-8">
              <Label htmlFor="business_type" className="text-base font-medium text-foreground mb-3 block">
                What type of business do you run?
              </Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => setFormData({ ...formData, business_type: value })}
              >
                <SelectTrigger className="h-12 bg-background/80 border-border/70 text-foreground">
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-border/70">
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Automation Goal */}
            <div className="mb-8">
              <Label htmlFor="automation_goal" className="text-base font-medium text-foreground mb-3 block">
                What's your main automation goal?
              </Label>
              <Select
                value={formData.automation_goal}
                onValueChange={(value) => setFormData({ ...formData, automation_goal: value })}
              >
                <SelectTrigger className="h-12 bg-background/80 border-border/70 text-foreground">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-border/70">
                  <SelectItem value="save-time">Save time on repetitive tasks</SelectItem>
                  <SelectItem value="improve-efficiency">Improve operational efficiency</SelectItem>
                  <SelectItem value="scale-business">Scale my business</SelectItem>
                  <SelectItem value="customer-support">Better customer support</SelectItem>
                  <SelectItem value="data-management">Automate data management</SelectItem>
                  <SelectItem value="marketing">Marketing automation</SelectItem>
                  <SelectItem value="sales">Sales process automation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Count */}
            <div className="mb-10">
              <Label htmlFor="client_count" className="text-base font-medium text-foreground mb-3 block">
                How many clients do you typically work with?
              </Label>
              <Select
                value={formData.client_count}
                onValueChange={(value) => setFormData({ ...formData, client_count: value })}
              >
                <SelectTrigger className="h-12 bg-background/80 border-border/70 text-foreground">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-border/70">
                  <SelectItem value="1-10">1-10 clients</SelectItem>
                  <SelectItem value="11-50">11-50 clients</SelectItem>
                  <SelectItem value="51-100">51-100 clients</SelectItem>
                  <SelectItem value="101-500">101-500 clients</SelectItem>
                  <SelectItem value="500+">500+ clients</SelectItem>
                  <SelectItem value="none">I don't have clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="w-full group relative px-8 py-4 bg-primary text-primary-foreground font-accent text-lg rounded-xl overflow-hidden btn-system disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: "0 0 40px hsl(217 100% 60% / 0.3), 0 8px 32px -8px hsl(217 100% 50% / 0.4)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue with Google
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
              {!isSubmitting && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-[length:200%_100%]"
                  animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              )}
            </motion.button>

            <p className="text-sm text-foreground/40 text-center mt-6">
              By continuing, you'll sign in with Google and create your Synth account
            </p>
          </motion.form>

          {/* Already have an account section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-4 text-foreground/40">Already have an account?</span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleSignInButton variant="secondary" className="w-full" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

