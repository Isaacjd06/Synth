"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Cpu, GitBranch, Workflow, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* AI Spotlight behind headline */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px]">
        <div className="absolute inset-0 bg-spotlight opacity-80" />
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 60% / 0.08) 0%, transparent 50%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Neural network background nodes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-[15%] left-[8%] p-4 rounded-2xl glass-node"
          animate={{ y: [-8, 8, -8], rotate: [0, 2, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cpu className="w-6 h-6 text-primary/60" />
        </motion.div>
        <motion.div
          className="absolute top-[28%] right-[12%] p-3 rounded-xl glass-node"
          animate={{ y: [6, -8, 6], rotate: [0, -2, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <GitBranch className="w-5 h-5 text-primary/60" />
        </motion.div>
        <motion.div
          className="absolute bottom-[32%] left-[15%] p-3 rounded-xl glass-node"
          animate={{ y: [-10, 6, -10], x: [-3, 3, -3] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Workflow className="w-5 h-5 text-primary/60" />
        </motion.div>
        <motion.div
          className="absolute top-[50%] right-[18%] p-3 rounded-xl glass-node"
          animate={{ y: [5, -7, 5], x: [2, -2, 2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Zap className="w-5 h-5 text-primary/60" />
        </motion.div>
        
        {/* Flow path curves */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <motion.path
            d="M 10% 30% Q 30% 20%, 50% 35% T 90% 40%"
            stroke="hsl(217 100% 60%)"
            strokeWidth="1.5"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M 15% 70% Q 40% 60%, 60% 70% T 85% 55%"
            stroke="hsl(217 100% 60%)"
            strokeWidth="1"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </svg>
      </div>
      
      {/* Computation grid */}
      <div className="absolute inset-0 grid-computation opacity-40" />

      <div className="container relative z-10 px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* System badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-node mb-12 glow-neural cursor-default"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground/85 tracking-wide">
              AI-Native Automation Platform
            </span>
          </motion.div>

          {/* Headline with deliberate reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display-bold tracking-tight mb-8 leading-[1.02]"
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

          {/* Subheadline - communicating intelligence */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-14 leading-relaxed"
          >
            Describe what you need. Synth <span className="text-foreground/90 font-medium">interprets your intent</span>, 
            {" "}<span className="text-gradient font-medium">builds the automation</span>, and runs it autonomously. 
            No configuration required.
          </motion.p>

          {/* System action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/waitlist">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 bg-primary text-primary-foreground font-accent rounded-xl overflow-hidden btn-system"
                style={{
                  boxShadow: "0 0 30px hsl(217 100% 60% / 0.3), 0 6px 24px -6px hsl(217 100% 50% / 0.35)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Join the Waitlist
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-[length:200%_100%]"
                  animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
              </motion.button>
            </Link>

            <Link href="/app/dashboard">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 border border-border bg-background/50 text-foreground font-accent rounded-xl hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  Open App
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/95 to-transparent" />
    </section>
  );
};

export default HeroSection;




