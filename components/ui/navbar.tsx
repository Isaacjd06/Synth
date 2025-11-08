"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between px-6 py-4 bg-black border-b border-zinc-800 shadow-[0_0_20px_#0229bf]"
    >
      {/* Left: Logo and title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#0229bf] rounded-xl shadow-[0_0_20px_#0229bf]" />
        <span className="text-xl font-semibold text-zinc-100 tracking-tight">
          Synth
        </span>
      </div>

      {/* Right: User icon */}
      <div className="p-2 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition">
        <User className="w-5 h-5 text-zinc-300" />
      </div>
    </motion.nav>
  );
}
