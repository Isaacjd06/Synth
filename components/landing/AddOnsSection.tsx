"use client";
import { motion } from "framer-motion";
import { Zap, Rocket, Briefcase, Brain, Database } from "lucide-react";

const addons = [
  {
    icon: Zap,
    title: "Rapid Automation Booster Pack",
    description: "Unlock an extra 25,000 automation runs instantly to handle traffic spikes, launches, or heavy workflow activity.",
  },
  {
    icon: Rocket,
    title: "Workflow Performance Turbo",
    description: "Gain priority execution in Synth's automation queue for dramatically faster workflow processing times.",
  },
  {
    icon: Briefcase,
    title: "Business Systems Jumpstart Kit",
    description: "Done-for-you workflow design + optimization. Synth builds your foundational automations and configures them so your business can run on autopilot immediately.",
  },
  {
    icon: Brain,
    title: "AI Persona Training Upgrade",
    description: "Fine-tuning for Synth's AI brain to match your voice, business rules, and preferred workflow style. Greatly improves accuracy, reasoning, and instruction-following.",
  },
  {
    icon: Database,
    title: "Unlimited Knowledge Injection",
    description: "Unlimited document uploads + unlimited knowledge-base entries. Allows Synth to store much deeper business context for more intelligent workflow generation.",
  },
];

const AddOnsSection = () => {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Curved top separator */}
      <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden">
        <svg viewBox="0 0 1440 100" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path 
            d="M0,100 L0,40 Q720,0 1440,40 L1440,100 Z" 
            fill="#0a0a0a"
          />
        </svg>
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]" />
      
      {/* Subtle glow accent */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display-bold text-foreground mb-3">
            Add-ons
          </h2>
          <p className="text-foreground/50 max-w-xl">
            Enhance your automation power with premium upgrades
          </p>
        </motion.div>

        {/* Vertical Cards */}
        <div className="space-y-5 max-w-3xl">
          {addons.map((addon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ 
                y: -4, 
                transition: { duration: 0.25 } 
              }}
              className="group relative rounded-2xl bg-gradient-to-br from-[#111]/80 to-[#0d0d0d]/60 border border-white/[0.06] p-6 md:p-7 overflow-hidden cursor-default"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent" />
              </div>

              {/* Glowing border on hover */}
              <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/30 transition-all duration-500" />
              
              {/* Subtle shadow glow */}
              <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/20 via-transparent to-transparent blur-xl -z-10" />

              <div className="relative z-10 flex items-start gap-5">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(25,76,146,0.3)] transition-all duration-500">
                  <addon.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-display text-foreground mb-2 group-hover:text-primary/90 transition-colors duration-300">
                    {addon.title}
                  </h3>
                  <p className="text-foreground/50 text-sm md:text-base leading-relaxed group-hover:text-foreground/60 transition-colors duration-300">
                    {addon.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Curved bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <svg viewBox="0 0 1440 100" className="absolute top-0 w-full" preserveAspectRatio="none">
          <path 
            d="M0,0 L0,60 Q720,100 1440,60 L1440,0 Z" 
            fill="#0a0a0a"
          />
        </svg>
      </div>
    </section>
  );
};

export default AddOnsSection;




