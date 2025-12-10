"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Wand2, Rocket, ArrowRight } from "lucide-react";

const steps = [
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

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="how-it-works" className="py-16 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synth-surface/20 to-background" />
      
      <div className="container px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-sm font-accent text-primary uppercase tracking-widest mb-6"
          >
            The Process
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display-bold tracking-tight"
          >
            Three steps to <span className="text-gradient-accent">automation bliss</span>
          </motion.h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative">
            {/* Glowing data pipeline connector */}
            <div className="hidden md:block absolute top-[72px] left-[20%] right-[20%] h-[3px] rounded-full overflow-hidden">
              {/* Base line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute inset-0 origin-left bg-gradient-to-r from-primary/20 via-primary/35 to-primary/20"
              />
              
              {/* Animated data flow */}
              <motion.div
                className="absolute top-0 bottom-0 w-24"
                style={{
                  background: "linear-gradient(90deg, transparent, hsl(217 100% 70% / 0.6), hsl(200 100% 75% / 0.8), hsl(217 100% 70% / 0.6), transparent)",
                }}
                animate={isInView ? { left: ["-20%", "120%"] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* Node connection points */}
            <div className="hidden md:flex absolute top-[70px] left-[20%] right-[20%] justify-between px-1">
              {[0, 1, 2].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-primary shadow-neon"
                  style={{ marginLeft: i === 0 ? '-4px' : undefined, marginRight: i === 2 ? '-4px' : undefined }}
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
                  <div className="relative inline-block mb-10">
                    <motion.div
                      whileHover={{ scale: 1.06 }}
                      className="w-20 h-20 rounded-2xl glass-node flex items-center justify-center relative z-10 transition-all duration-400 group-hover:shadow-node"
                    >
                      <step.icon className="w-8 h-8 text-primary" />
                      
                      {/* Thinking pulse animation */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border border-primary/25"
                        animate={isInView ? { 
                          scale: [1, 1.12, 1],
                          opacity: [0.4, 0, 0.4],
                        } : {}}
                        transition={{ 
                          duration: 3.5, 
                          repeat: Infinity, 
                          delay: index * 1,
                        }}
                      />
                    </motion.div>
                    
                    {/* Step number */}
                    <motion.span 
                      className="absolute -top-3 -right-3 text-4xl font-display-bold"
                      style={{
                        background: "linear-gradient(180deg, hsl(217 100% 60% / 0.55), hsl(217 100% 60% / 0.15))",
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
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full glass-node text-[10px] font-accent text-primary/70 uppercase tracking-wider"
                    >
                      {step.phase}
                    </motion.div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-display font-semibold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>

                  <p className="text-foreground/60 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                  
                  {/* Arrow indicator for mobile */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-8 mb-4">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5 text-primary/40 rotate-90" />
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
};

export default HowItWorksSection;



