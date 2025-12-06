"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Mail,
  FileText,
  Calendar,
  Bell,
  Database,
  Share2,
  MessageSquare,
  PieChart,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Automation {
  icon: LucideIcon;
  title: string;
  description: string;
}

const automations: Automation[] = [
  {
    icon: Mail,
    title: "Smart Email Routing",
    description: "Trigger: Incoming email → Transform: Categorize & extract → Execute: Route to team",
  },
  {
    icon: FileText,
    title: "Document Processing",
    description: "Trigger: Document uploaded → Transform: Extract data → Execute: Sync to systems",
  },
  {
    icon: Calendar,
    title: "Meeting Intelligence",
    description: "Trigger: Meeting ends → Transform: Parse notes → Execute: Create tasks & follow-ups",
  },
  {
    icon: Bell,
    title: "Alert Orchestration",
    description: "Trigger: Event detected → Transform: Assess priority → Execute: Notify right person",
  },
  {
    icon: Database,
    title: "Data Synchronization",
    description: "Trigger: Data changed → Transform: Map fields → Execute: Update all connected tools",
  },
  {
    icon: Share2,
    title: "Cross-Platform Flows",
    description: "Trigger: Action in App A → Transform: Process → Execute: Actions in Apps B, C, D",
  },
  {
    icon: MessageSquare,
    title: "Customer Response",
    description: "Trigger: New inquiry → Transform: Context lookup → Execute: Draft personalized reply",
  },
  {
    icon: PieChart,
    title: "Report Generation",
    description: "Trigger: Schedule/request → Transform: Aggregate data → Execute: Generate & distribute",
  },
];

export default function ExampleAutomationsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-16 md:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-transparent" />

      {/* Neural network nodes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/25"
            style={{
              left: `${15 + i * 18}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          />
        ))}
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-nodes opacity-25" />

      <div className="container relative z-10 px-6">
        <div className="mb-12 text-center md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-primary"
          >
            Workflow Library
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto max-w-3xl font-display-bold text-4xl tracking-tight text-foreground md:text-5xl lg:text-6xl"
          >
            Endless possibilities, <span className="text-gradient-accent">zero limits</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-muted-foreground"
          >
            Each automation follows the pattern: <span className="text-primary/80">Trigger</span> →{" "}
            <span className="text-foreground/80">Transform</span> → <span className="text-primary/80">Execute</span>
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {automations.map((automation, index) => (
            <motion.div
              key={automation.title}
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.07 }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-6 shadow transition-colors hover:border-primary/50"
              >
                {/* Icon as workflow node */}
                <div className="relative mb-5">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-all group-hover:border-primary/40 group-hover:bg-primary/20"
                  >
                    <automation.icon className="h-5 w-5 text-primary" />
                  </motion.div>

                  {/* Flow indicator */}
                  <motion.div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <ArrowRight className="h-3 w-3 text-primary/40" />
                  </motion.div>
                </div>

                <h3 className="font-display mb-2 text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                  {automation.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {automation.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
