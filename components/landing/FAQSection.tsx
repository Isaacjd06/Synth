"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What makes Synth different from Zapier or Make?",
    answer: "Unlike traditional automation tools where you manually connect triggers and actions, Synth uses AI to understand what you're trying to accomplish. Simply describe your workflow in plain English, and Synth builds it for you. No drag-and-drop required."
  },
  {
    question: "Do I need technical knowledge to use Synth?",
    answer: "Not at all! Synth is designed for everyone. Just tell it what you want to automate in your own words, and the AI handles all the technical setup. It's like having an automation expert on your team."
  },
  {
    question: "How does the AI understand my business context?",
    answer: "Synth learns from your interactions, integrations, and the knowledge you provide. Over time, it builds a deep understanding of your business processes, terminology, and preferences, making automations increasingly accurate."
  },
  {
    question: "What integrations does Synth support?",
    answer: "Synth connects with 500+ apps including Slack, Gmail, Google Workspace, HubSpot, Shopify, Salesforce, Notion, and many more. We're constantly adding new integrations based on user requests."
  },
  {
    question: "Is my data secure with Synth?",
    answer: "Absolutely. Synth is SOC 2 compliant with end-to-end encryption for all data. We never store your credentials directly, and all integrations use secure OAuth protocols. Your data never leaves your control."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your dashboard. If you cancel, you'll retain access until the end of your billing period. No questions asked, no hidden fees."
  },
  {
    question: "What happens if I exceed my monthly run limit?",
    answer: "We'll send you a friendly warning when you're approaching your limit. If you exceed it, your workflows will pause until your next billing cycle, or you can upgrade your plan or add a capacity pack."
  },
  {
    question: "How fast are Synth automations?",
    answer: "Synth workflows execute in milliseconds. Our infrastructure is optimized for speed and reliability, with 99.9% uptime guaranteed. Critical automations never miss a beat."
  },
  {
    question: "Can I try Synth before committing to a plan?",
    answer: "Yes! We offer a 3-day free trial with full access to all features. No credit card required to start. Experience the power of AI-driven automation risk-free."
  },
  {
    question: "Do you offer support for enterprise customers?",
    answer: "Yes, our Agency plan includes dedicated support, custom integrations, white-label options, and SLA guarantees. Contact our sales team for custom enterprise solutions."
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="contact" className="py-16 md:py-20 relative overflow-hidden">
      {/* Diagonal gradient background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "linear-gradient(135deg, hsl(217 100% 50% / 0.03) 0%, transparent 50%, hsl(217 100% 50% / 0.02) 100%)",
        }}
      />

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-display-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-foreground/50">
            Everything you need to know about Synth.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-[#111]/60 border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
              >
                <span className="font-medium text-foreground group-hover:text-primary transition-colors pr-4">
                  {faq.question}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  {openIndex === i ? (
                    <Minus className="w-4 h-4 text-primary" />
                  ) : (
                    <Plus className="w-4 h-4 text-foreground/50" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="px-5 md:px-6 pb-5 md:pb-6">
                      <p className="text-foreground/60 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;



