"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, GitBranch, Workflow, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const floatingIcons = [
  { Icon: Cpu, position: "top-[15%] left-[8%]", delay: 0, duration: 12 },
  { Icon: GitBranch, position: "top-[28%] right-[12%]", delay: 1, duration: 10 },
  { Icon: Workflow, position: "bottom-[32%] left-[15%]", delay: 2, duration: 11 },
  { Icon: Zap, position: "top-[50%] right-[18%]", delay: 0.5, duration: 9 },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Spotlight behind headline */}
      <div className="absolute left-1/2 top-0 h-[600px] w-full max-w-4xl -translate-x-1/2">
        <motion.div
          className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 50%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating icon nodes */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingIcons.map(({ Icon, position, delay, duration }, index) => (
          <motion.div
            key={index}
            className={`absolute rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm ${position}`}
            animate={{
              y: index % 2 === 0 ? [-8, 8, -8] : [6, -8, 6],
              rotate: index % 2 === 0 ? [0, 2, 0] : [0, -2, 0],
            }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
          >
            <Icon className="h-6 w-6 text-primary/60" />
          </motion.div>
        ))}

        {/* Flow path curves */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" preserveAspectRatio="none">
          <motion.path
            d="M 10% 30% Q 30% 20%, 50% 35% T 90% 40%"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M 15% 70% Q 40% 60%, 60% 70% T 85% 55%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </svg>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-computation opacity-30" />

      <div className="container relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 inline-flex cursor-default items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground/80">
              AI-Native Automation Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mb-8 font-display-bold text-5xl leading-tight tracking-tight md:text-7xl lg:text-[5.5rem]"
          >
            <span className="block">Automate your</span>
            <motion.span
              className="text-gradient-pulse inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              entire workflow
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Describe what you need. Synth <span className="font-medium text-foreground">interprets your intent</span>,{" "}
            <span className="font-medium text-primary">builds the automation</span>, and runs it autonomously.
            No configuration required.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-5 sm:flex-row"
          >
            <Link href="/waitlist">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="group relative overflow-hidden rounded-lg px-8 py-4 shadow-lg">
                  <span className="relative z-10 flex items-center gap-2">
                    Join the Waitlist
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary bg-[length:200%_100%] opacity-50"
                    animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                </Button>
              </motion.div>
            </Link>

            <motion.a
              href="#how-it-works"
              whileHover={{ x: 4 }}
              className="group flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <span>See how Synth works</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
