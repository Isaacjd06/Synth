"use client";
import { motion } from "framer-motion";
import { MessageSquare, Cpu, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe what you want",
    description: "Simply tell Synth what you need in plain English. No technical knowledge required.",
    visual: "chat",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Synth thinks & builds",
    description: "Our AI interprets your intent and automatically constructs the perfect automation workflow.",
    visual: "build",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Your business runs on autopilot",
    description: "Sit back while Synth executes your workflows 24/7 with enterprise-grade reliability.",
    visual: "run",
  },
];

const NewHowItWorksSection = () => {
  return (
    <section id="about" className="py-16 md:py-20 relative overflow-hidden">
      {/* Curved background */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1440 600" className="absolute top-0 w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 Q360,0 720,50 T1440,100 L1440,600 L0,600 Z"
            fill="#0a0a0a"
          />
        </svg>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#080808]" />

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 mb-6">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-display-bold text-foreground">
            Three steps to automation
          </h2>
        </motion.div>

        {/* Staggered Steps */}
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              } ${i > 0 ? "md:-mt-8" : ""}`}
              style={{ marginLeft: i % 2 === 0 ? "0" : "auto", marginRight: i % 2 === 1 ? "0" : "auto" }}
            >
              {/* Content */}
              <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                <div className={`flex items-center gap-4 mb-4 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <span className="text-6xl font-display-bold text-primary/20">{step.number}</span>
                  <div className="w-14 h-14 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-display text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-foreground/50 text-lg leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>

              {/* Visual */}
              <motion.div 
                className="flex-1 w-full max-w-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative rounded-2xl bg-[#111]/60 border border-white/5 p-6 overflow-hidden">
                  {/* Animated content based on step */}
                  {step.visual === "chat" && (
                    <div className="space-y-3">
                      <motion.div 
                        className="bg-[#1a1a1a] rounded-lg p-3 text-sm text-foreground/70"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        "Send a Slack message when I get a new email from a VIP client"
                      </motion.div>
                      <motion.div
                        className="flex gap-1 ml-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {[0, 1, 2].map((_, j) => (
                          <motion.div
                            key={j}
                            className="w-2 h-2 rounded-full bg-primary/60"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {step.visual === "build" && (
                    <div className="space-y-3">
                      {["Email Trigger", "Filter VIP", "Send Slack"].map((node, j) => (
                        <motion.div
                          key={j}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + j * 0.2 }}
                        >
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                          <div className="flex-1 h-10 bg-[#1a1a1a] rounded-lg flex items-center px-3 text-sm text-foreground/60">
                            {node}
                          </div>
                          {j < 2 && <div className="w-px h-4 bg-primary/30" />}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {step.visual === "run" && (
                    <div className="text-center py-4">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <p className="text-sm text-foreground/60">Workflow running</p>
                      <motion.p 
                        className="text-2xl font-display-bold text-foreground mt-1"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        24/7
                      </motion.p>
                    </div>
                  )}

                  {/* Corner glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewHowItWorksSection;



