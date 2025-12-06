"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Wand2, Rocket, ArrowRight, type LucideIcon } from "lucide-react";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

const steps: Step[] = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Express your intent",
    description: "Describe what you want to automate in plain language. Synth understands context, not just keywords.",
    phase: "Input",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Synth builds the system",
    description: "Our AI interprets your intent, constructs the workflow logic, and connects all necessary components.",
    phase: "Processing",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Automation runs autonomously",
    description: "Your workflow executes automatically, adapts to changes, and reports back through a simple dashboard.",
    phase: "Execution",
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="how-it-works" className="relative overflow-hidden py-16 md:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      <div className="container relative z-10 px-6">
        <div className="mb-12 text-center md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-primary"
          >
            The Process
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display-bold text-4xl tracking-tight md:text-5xl lg:text-6xl"
          >
            Three steps to <span className="text-gradient-accent">automation bliss</span>
          </motion.h2>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {/* Glowing data pipeline connector */}
            <div className="absolute left-[20%] right-[20%] top-[72px] hidden h-[3px] overflow-hidden rounded-full md:block">
              {/* Base line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute inset-0 origin-left bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20"
              />

              {/* Animated data flow */}
              <motion.div
                className="absolute bottom-0 top-0 w-24"
                style={{
                  background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.6), transparent)",
                }}
                animate={isInView ? { left: ["-20%", "120%"] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm" />
            </div>

            {/* Node connection points */}
            <div className="absolute left-[20%] right-[20%] top-[70px] hidden justify-between px-1 md:flex">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.2 }}
                  className="h-2 w-2 rounded-full bg-primary shadow-lg"
                  style={{ marginLeft: i === 0 ? "-4px" : undefined, marginRight: i === 2 ? "-4px" : undefined }}
                />
              ))}
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 + index * 0.2 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="group text-center"
                >
                  {/* Step icon node */}
                  <div className="relative mb-10 inline-block">
                    <motion.div
                      whileHover={{ scale: 1.06 }}
                      className="relative z-10 flex h-20 w-20 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all group-hover:border-primary/50"
                    >
                      <step.icon className="h-8 w-8 text-primary" />

                      {/* Thinking pulse animation */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border border-primary/25"
                        animate={
                          isInView
                            ? {
                                scale: [1, 1.12, 1],
                                opacity: [0.4, 0, 0.4],
                              }
                            : {}
                        }
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          delay: index * 1,
                        }}
                      />
                    </motion.div>

                    {/* Step number */}
                    <motion.span
                      className="font-display-bold absolute -right-3 -top-3 text-4xl"
                      style={{
                        background: "linear-gradient(180deg, hsl(var(--primary) / 0.55), hsl(var(--primary) / 0.15))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {step.number}
                    </motion.span>

                    {/* Phase label */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.8 + index * 0.2 }}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary/70"
                    >
                      {step.phase}
                    </motion.div>
                  </div>

                  <h3 className="font-display mb-4 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
                    {step.title}
                  </h3>

                  <p className="mx-auto max-w-xs leading-relaxed text-muted-foreground">{step.description}</p>

                  {/* Arrow indicator for mobile */}
                  {index < steps.length - 1 && (
                    <div className="mb-4 mt-8 flex justify-center md:hidden">
                      <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <ArrowRight className="h-5 w-5 rotate-90 text-primary/40" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
