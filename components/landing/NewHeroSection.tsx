"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, Workflow, Zap, GitBranch } from "lucide-react";

const NewHeroSection = () => {
  return (
    <section className="relative pt-24 pb-8 overflow-hidden">
      {/* Soft blue radial glow */}
      <div className="absolute top-1/4 left-1/3 w-[800px] h-[800px] rounded-full opacity-30">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 50% / 0.15) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${10 + (i * 4.5)}%`,
              top: `${20 + (i % 5) * 15}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:pr-8"
          >
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display-bold tracking-tight leading-[1.05] mb-6">
              <span className="block text-foreground">Automate</span>
              <span className="block text-foreground">Everything.</span>
              <motion.span 
                className="block text-gradient-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Instantly.
              </motion.span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-xl text-foreground/60 max-w-xl mb-10 leading-relaxed"
            >
              Synth is the AI automation brain that understands your business, 
              creates workflows for you, and runs them 24/7 — no coding, no setup, no complexity.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-5"
            >
              <Link href="/onboarding">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative px-8 py-4 bg-primary text-primary-foreground font-accent text-lg rounded-xl overflow-hidden btn-system"
                  style={{
                    boxShadow: "0 0 40px hsl(217 100% 60% / 0.3), 0 8px 32px -8px hsl(217 100% 50% / 0.4)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-[length:200%_100%]"
                    animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </motion.button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-foreground/40"
            >
              No credit card required.
            </motion.p>
          </motion.div>

          {/* Right Side - Animation Block */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:pl-8"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central Brain Node */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-primary/30 flex items-center justify-center z-20"
                animate={{ 
                  boxShadow: [
                    "0 0 30px hsl(217 100% 60% / 0.2)",
                    "0 0 60px hsl(217 100% 60% / 0.4)",
                    "0 0 30px hsl(217 100% 60% / 0.2)",
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Brain className="w-14 h-14 text-primary" />
              </motion.div>

              {/* Orbiting Nodes */}
              {[
                { icon: Workflow, delay: 0, angle: 0 },
                { icon: Zap, delay: 0.5, angle: 90 },
                { icon: GitBranch, delay: 1, angle: 180 },
                { icon: Workflow, delay: 1.5, angle: 270 },
              ].map((node, i) => (
                <motion.div
                  key={i}
                  className="absolute w-16 h-16 rounded-2xl bg-[#111]/80 border border-white/10 flex items-center justify-center backdrop-blur-sm"
                  style={{
                    top: `${50 + 38 * Math.sin((node.angle * Math.PI) / 180)}%`,
                    left: `${50 + 38 * Math.cos((node.angle * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: node.delay,
                  }}
                >
                  <node.icon className="w-7 h-7 text-foreground/70" />
                </motion.div>
              ))}

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {[0, 90, 180, 270].map((angle, i) => (
                  <motion.line
                    key={i}
                    x1="200"
                    y1="200"
                    x2={200 + 130 * Math.cos((angle * Math.PI) / 180)}
                    y2={200 + 130 * Math.sin((angle * Math.PI) / 180)}
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
                    transition={{ 
                      pathLength: { duration: 2, delay: i * 0.3 },
                      opacity: { duration: 3, repeat: Infinity, delay: i * 0.5 }
                    }}
                  />
                ))}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(217 100% 60% / 0.1)" />
                    <stop offset="50%" stopColor="hsl(217 100% 60% / 0.5)" />
                    <stop offset="100%" stopColor="hsl(217 100% 60% / 0.1)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Outer Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-primary/10"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Curved gradient transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full" preserveAspectRatio="none">
          <path
            d="M0,120 L0,60 Q720,0 1440,60 L1440,120 Z"
            fill="url(#curveGradient)"
          />
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#080808" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default NewHeroSection;


