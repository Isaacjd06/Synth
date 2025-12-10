"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, GitMerge, Workflow, Sparkles } from "lucide-react";

const WhatIsSynthSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-20 relative overflow-hidden">
      {/* Seamless background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synth-surface/30 to-transparent" />
      
      {/* AI interpretation visualization - context recognition */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        {/* Central intelligence glow */}
        <motion.div 
          className="absolute inset-[20%] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 60% / 0.06) 0%, transparent 55%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Pattern recognition orbits */}
        <motion.div
          className="absolute inset-[10%] border border-primary/8 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <motion.div 
            className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-primary/35"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          className="absolute inset-[25%] border border-primary/5 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <motion.div 
            className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-primary/25"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
        
        {/* Branching logic indicators */}
        <motion.div
          className="absolute top-[15%] left-[20%] w-2 h-2 rounded-full bg-primary/30"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[25%] w-1.5 h-1.5 rounded-full bg-primary/25"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>
      
      <div className="container px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Intelligence icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-node mb-10 icon-node"
            style={{ animation: isInView ? "thinking-pulse 3s ease-in-out infinite" : "none" }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-sm font-accent text-primary uppercase tracking-widest mb-6"
          >
            The Intelligence Layer
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display-bold tracking-tight mb-12"
          >
            What is <span className="text-gradient">Synth</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-8 text-lg md:text-xl text-foreground/70 leading-relaxed"
          >
            <p>
              Synth is a <span className="text-foreground/90 font-medium">thinking automation engine</span> that 
              interprets natural language, <span className="text-gradient font-medium">understands workflow patterns</span>, 
              and constructs complete automation systems dynamically.
            </p>
            <p>
              It replaces traditional manual configuration. Describe your intent—Synth handles 
              context recognition, <span className="text-gradient font-medium">builds branching logic</span>, 
              links patterns together, and <span className="text-foreground/90 font-medium">adapts based on behavior</span>.
            </p>
          </motion.div>

          {/* Visual capability indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4"
          >
            {[
              { icon: Sparkles, label: "Context Recognition" },
              { icon: GitMerge, label: "Pattern Linking" },
              { icon: Workflow, label: "System Building" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass-node text-sm text-foreground/70"
              >
                <item.icon className="w-4 h-4 text-primary/70" />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsSynthSection;



