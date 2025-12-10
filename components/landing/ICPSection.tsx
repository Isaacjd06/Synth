"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Briefcase, Code2, BarChart3, CheckCircle2 } from "lucide-react";

const personas = [
  {
    icon: Briefcase,
    title: "Operations Teams",
    subtitle: "Reliability & System Clarity",
    description: "Eliminate manual errors and gain full visibility into processes. Synth builds reliable systems that scale across departments.",
    benefits: ["Error reduction", "Process visibility", "Cross-team sync"],
  },
  {
    icon: Code2,
    title: "Product Builders",
    subtitle: "Zero Cognitive Load",
    description: "Abstract away complexity. Focus on building products while Synth handles the repetitive infrastructure work automatically.",
    benefits: ["No-code automation", "Instant integrations", "Background tasks"],
  },
  {
    icon: BarChart3,
    title: "Growth Leaders",
    subtitle: "Real-Time Execution",
    description: "Automate experiments, nurture leads, and execute workflows in real-time. Let data drive decisions, automatically.",
    benefits: ["Automated follow-ups", "Live insights", "Scaled experiments"],
  },
];

const ICPSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-transparent" />
      
      {/* Data flow lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-[30%] w-px h-full"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(217 100% 60% / 0.12), transparent)",
          }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-0 right-[38%] w-px h-full"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(217 100% 60% / 0.08), transparent)",
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>
      
      <div className="container px-6 relative z-10">
        <div className="text-center mb-12 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-sm font-accent text-primary uppercase tracking-widest mb-6"
          >
            Use Cases
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display-bold tracking-tight max-w-2xl mx-auto"
          >
            Designed for <span className="text-gradient">ambitious</span> teams
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + index * 0.15 }}
            >
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4 }}
                className="group relative h-full"
              >
                {/* Glow backdrop */}
                <motion.div 
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                />
                
                <div className="relative h-full p-8 lg:p-9 rounded-2xl card-node flow-border">
                  {/* Icon with subtle animation */}
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-6 transition-all duration-400 group-hover:bg-primary/15 group-hover:border-primary/30 icon-node"
                    whileHover={{ scale: 1.05 }}
                    animate={isInView ? { y: [0, -3, 0] } : {}}
                    transition={{ y: { duration: 4, repeat: Infinity, delay: index * 0.5 } }}
                  >
                    <persona.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-xl font-display font-semibold mb-1 text-foreground group-hover:text-primary transition-colors duration-300">
                    {persona.title}
                  </h3>
                  
                  <p className="text-sm font-accent text-primary/70 mb-4">
                    {persona.subtitle}
                  </p>
                  
                  <p className="text-foreground/60 leading-relaxed mb-6">
                    {persona.description}
                  </p>
                  
                  {/* Benefit indicators */}
                  <div className="space-y-2">
                    {persona.benefits.map((benefit, i) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.5 + index * 0.15 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm text-foreground/55"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
                        <span>{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ICPSection;



