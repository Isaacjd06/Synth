"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CEO, TechFlow",
    avatar: "SC",
    content: "Synth cut our manual work by 80%. What used to take our team hours now happens automatically in seconds.",
    rating: 5,
  },
  {
    name: "Marcus Williams",
    role: "Operations Lead, ScaleUp",
    avatar: "MW",
    content: "The AI actually understands what I'm trying to do. I just describe the workflow in plain English and Synth builds it perfectly.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Founder, GrowthLabs",
    avatar: "ER",
    content: "We've tried Zapier, n8n, and Make. Synth is in a completely different league. It thinks for you.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "CTO, DataStream",
    avatar: "DP",
    content: "The enterprise-grade reliability combined with AI-powered setup is exactly what we needed. Synth handles millions of operations for us.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Marketing Director, BrandHQ",
    avatar: "LT",
    content: "I'm not technical at all, but Synth makes automation accessible. It's like having an automation expert on staff 24/7.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#080808] to-[#0a0a0a]" />

      {/* Decorative bubbles */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display-bold text-foreground mb-4">
            Loved by automation teams
          </h2>
          <p className="text-lg text-foreground/50">
            See what our customers have to say about Synth.
          </p>
        </motion.div>

        {/* Staggered Testimonial Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl bg-[#111]/60 border border-white/5 p-6 ${
                  i === 0 ? "lg:col-span-2" : ""
                } ${i === 3 ? "lg:row-span-2" : ""}`}
                style={{
                  marginTop: i % 3 === 1 ? "20px" : i % 3 === 2 ? "40px" : "0",
                }}
              >
                {/* Shadow bubble */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + j * 0.1 }}
                    >
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <p className={`text-foreground/70 mb-6 leading-relaxed ${
                  i === 0 || i === 3 ? "text-lg" : ""
                }`}>
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-foreground/40">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;



