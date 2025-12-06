"use client";

import { motion } from "framer-motion";

export default function BackgroundEffects() {
  return (
    <>
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-background via-background to-background" />

      {/* Neural network ambient visualization */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Primary intelligence glow */}
        <motion.div
          className="absolute left-[15%] top-[5%] h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Secondary reasoning glow */}
        <motion.div
          className="absolute bottom-[10%] right-[5%] h-[550px] w-[550px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 55%)",
          }}
          animate={{
            scale: [1.05, 0.95, 1.05],
            y: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div className="pointer-events-none fixed inset-0 grid-nodes opacity-20" />

      {/* Neural network nodes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/30"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -15 - (i % 3) * 8, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}

        {/* Connection lines between nodes */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
          <motion.line
            x1="15%" y1="25%" x2="35%" y2="45%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.line
            x1="65%" y1="20%" x2="85%" y2="40%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
          <motion.line
            x1="25%" y1="60%" x2="50%" y2="75%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          />
        </svg>
      </div>

      {/* Scan line */}
      <motion.div
        className="pointer-events-none fixed left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.25), transparent)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}
