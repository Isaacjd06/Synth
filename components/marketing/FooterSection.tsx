"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function FooterSection() {
  return (
    <footer className="relative overflow-hidden py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />

      {/* Subtle grid */}
      <div className="absolute inset-0 grid-computation opacity-10" />

      <div className="container relative z-10 px-6">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo with intelligence glow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-6 flex items-center gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{ animation: "thinking-pulse 4s ease-in-out infinite" }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="font-display-bold text-2xl tracking-tight text-foreground">Synth</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6 text-sm text-muted-foreground"
          >
            The thinking automation engine.
          </motion.p>

          {/* Join Waitlist Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/waitlist">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="group relative mb-8 overflow-hidden rounded-lg px-6 py-3 text-sm shadow-lg">
                  <span className="relative z-10 flex items-center gap-2">
                    Join the Waitlist
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary bg-[length:200%_100%] opacity-50"
                    animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xs text-muted-foreground"
          >
            © Synth — All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
}
