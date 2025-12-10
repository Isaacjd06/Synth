"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Brain, Layers, Shield, ArrowRight, Cpu, GitBranch } from "lucide-react";

const features = [
  {
    icon: Brain,
    accentIcon: Cpu,
    title: "Truly Intelligent",
    description: "Synth analyzes context, learns from patterns, and adapts its behavior. It doesn't just execute—it reasons and evolves.",
    visual: "analysis",
  },
  {
    icon: Zap,
    accentIcon: ArrowRight,
    title: "Instant Setup",
    description: "Intent in, working automation out. No manual configuration, no learning curve. Describe what you need and it's built.",
    visual: "flow",
  },
  {
    icon: Layers,
    accentIcon: GitBranch,
    title: "Infinitely Composable",
    description: "Modular blocks that connect in any combination. Build complex systems from simple components that scale together.",
    visual: "nodes",
  },
  {
    icon: Shield,
    accentIcon: null,
    title: "Enterprise-Ready",
    description: "Bank-grade security with SOC 2 compliance. Granular permissions ensure your automations stay secure at scale.",
    visual: "secure",
  },
];

const WhyDifferentSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synth-surface/25 to-transparent" />
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 grid-computation opacity-30" />
      
      {/* Floating intelligence glow */}
      <motion.div 
        className="absolute top-1/3 right-0 w-[450px] h-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(217 100% 60% / 0.06) 0%, transparent 55%)",
        }}
        animate={{ x: [-20, 30, -20], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="container px-6 relative z-10">
        <div className="text-center mb-12 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-sm font-accent text-primary uppercase tracking-widest mb-6"
          >
            System Architecture
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display-bold tracking-tight"
          >
            Built for the <span className="text-gradient">modern</span> team
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + index * 0.12 }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35 }}
                className="group h-full p-8 lg:p-10 rounded-2xl card-node relative overflow-hidden flow-border"
              >
                <div className="flex items-start gap-5">
                  {/* Icon with neural pulse */}
                  <motion.div 
                    className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center transition-all duration-400 group-hover:bg-primary/15 group-hover:border-primary/30 icon-node relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                    {/* Neural pulse on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-xl border border-primary/20"
                      initial={{ scale: 1, opacity: 0 }}
                      whileHover={{ scale: 1.3, opacity: [0, 0.5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/65 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                {/* Visual indicator based on feature type */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                  {feature.accentIcon && (
                    <feature.accentIcon className="w-4 h-4 text-primary/40" />
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferentSection;



