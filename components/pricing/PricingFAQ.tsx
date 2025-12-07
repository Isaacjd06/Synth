"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Synth keep usage predictable?",
    answer:
      "Synth uses soft caps and cost-control levers instead of hard per-task pricing. You'll always know what you're paying before the bill arrives. When you approach your automation limit, we notify you early so you can add a Capacity Pack or adjust workflows — no surprises, no hidden fees.",
  },
  {
    question: "What happens if I hit my automation cap?",
    answer:
      "You'll receive early warnings as you approach your monthly limit. When you hit the cap, you can instantly add a Capacity Pack to continue running automations without interruption. Your workflows never stop unexpectedly — you stay in control.",
  },
  {
    question: "Why don't you charge per task like Zapier?",
    answer:
      "Per-task pricing punishes power users and creates anxiety around automation. Synth uses AI planning to execute workflows more efficiently — often completing in fewer steps what others require many tasks for. This means more power for less, with predictable costs.",
  },
  {
    question: "Can I switch plans anytime?",
    answer:
      "Yes! Upgrading is instant — your new features and capacity become available immediately. Downgrading takes effect at the end of your current billing period. No penalties, no hassle.",
  },
  {
    question: "Is Done-For-You required?",
    answer:
      "Not at all. Done-For-You is completely optional but highly recommended if you want expert-built automations from day one. Our team handles everything from business intake to full workflow implementation, QA, and ongoing optimization.",
  },
  {
    question: "Are my integrations secure?",
    answer:
      "Absolutely. All credentials are encrypted and isolated per user. We never share access between accounts, and our infrastructure follows enterprise-grade security standards. Your data and connections remain private and protected.",
  },
];

export default function PricingFAQ() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-accent text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Everything you need to know about Synth's pricing and plans.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/30 rounded-xl px-6 data-[state=open]:bg-foreground/5 transition-colors"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

