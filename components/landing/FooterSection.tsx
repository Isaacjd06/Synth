"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
const FooterSection = () => {
  return (
    <footer className="py-10 relative overflow-hidden">
      {/* Seamless gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-synth-navy/50" />
      
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-computation opacity-20" />
      
      <div className="container px-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo with intelligence glow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.div 
              className="w-10 h-10 rounded-xl glass-node flex items-center justify-center icon-node"
              whileHover={{ scale: 1.05 }}
              style={{ animation: "thinking-pulse 4s ease-in-out infinite" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-2xl font-display-bold text-foreground tracking-tight">Synth</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm text-foreground/45 mb-6"
          >
            The thinking automation engine.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-8"
          >
            {/* Join Waitlist Button */}
            <Link href="/waitlist">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-6 py-3 bg-primary text-primary-foreground font-accent text-sm rounded-xl overflow-hidden btn-system"
                style={{
                  boxShadow: "0 0 25px hsl(217 100% 60% / 0.25), 0 4px 16px -4px hsl(217 100% 50% / 0.3)",
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

            {/* View Pricing Button */}
            <Link href="/pricing">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 font-accent text-sm rounded-xl border border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                View Pricing
              </motion.button>
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xs text-foreground/35"
          >
            © Synth — All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;




