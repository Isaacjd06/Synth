"use client";
import { motion } from "framer-motion";
import { Sparkles, Brain, Rocket, Zap, Settings, Shield } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "Build workflows automatically",
    description: "Tell Synth what needs to happen — it creates the entire workflow for you.",
    size: "large",
  },
  {
    icon: Brain,
    title: "Understands your business context",
    description: "Synth remembers your tasks, patterns, and preferences.",
    size: "medium",
  },
  {
    icon: Rocket,
    title: "Extremely scalable",
    description: "Runs thousands of automations with almost zero delay.",
    size: "medium",
  },
  {
    icon: Settings,
    title: "No setup. Ever.",
    description: "Unlike Zapier/n8n, Synth does the thinking and building.",
    size: "small",
  },
  {
    icon: Zap,
    title: "Lightning fast execution",
    description: "Your automations run in milliseconds, not minutes.",
    size: "small",
  },
  {
    icon: Shield,
    title: "Enterprise-grade security",
    description: "SOC 2 compliant with end-to-end encryption.",
    size: "small",
  },
];

const BenefitsSection = () => {
  return (
    <section id="features" className="py-16 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#080808] to-[#0a0a0a]" />
      
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(217 100% 50% / 0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display-bold text-foreground mb-4">
            Why businesses choose Synth
          </h2>
          <p className="text-lg text-foreground/50 max-w-2xl mx-auto">
            The automation platform that thinks, builds, and scales for you.
          </p>
        </motion.div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group relative rounded-2xl bg-[#111]/80 border border-white/5 p-8 overflow-hidden ${
                benefit.size === "large" ? "md:col-span-2 lg:row-span-2" : ""
              }`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              </div>

              {/* Glowing border on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, hsl(217 100% 60% / 0.1), transparent 50%)",
                }}
              />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:shadow-glow transition-all duration-300">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className={`font-display text-foreground mb-3 ${
                  benefit.size === "large" ? "text-2xl md:text-3xl" : "text-xl"
                }`}>
                  {benefit.title}
                </h3>

                <p className={`text-foreground/50 leading-relaxed ${
                  benefit.size === "large" ? "text-lg" : ""
                }`}>
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;



