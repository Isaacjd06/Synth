"use client";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-border/50 rounded-xl">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{ 
                y: [0, -6, 0], 
                opacity: [0.4, 1, 0.4] 
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground ml-1">Synth is thinking...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;




