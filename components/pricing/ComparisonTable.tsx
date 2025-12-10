"use client";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { useState } from "react";

const features = [
  { name: "Active workflows", starter: "3", growth: "10", scale: "30–40" },
  { name: "Automation run caps", starter: "~5k–10k/mo", growth: "~25k–35k/mo", scale: "~75k–100k/mo" },
  { name: "App integrations", starter: "Basic", growth: "Advanced", scale: "Full Access" },
  { name: "AI intent planning", starter: false, growth: true, scale: true },
  { name: "Chat interface", starter: true, growth: true, scale: true },
  { name: "Error handling level", starter: "Basic", growth: "Smart Retries", scale: "Advanced" },
  { name: "Workflow documentation", starter: false, growth: "AI-Generated", scale: "AI-Generated" },
  { name: "Data retention", starter: "7 days", growth: "30 days", scale: "90 days" },
  { name: "Support tier", starter: "Email", growth: "Priority Email", scale: "VIP" },
  { name: "Add-on access", starter: true, growth: true, scale: true },
  { name: "Execution priority", starter: false, growth: false, scale: true },
  { name: "SLA availability", starter: false, growth: false, scale: true },
];

const ComparisonTable = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedFeatures = isExpanded ? features : features.slice(0, 6);

  const renderValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-primary mx-auto" />
      ) : (
        <Minus className="w-5 h-5 text-foreground/20 mx-auto" />
      );
    }
    return <span className="text-foreground/80">{value}</span>;
  };

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
            Compare Plans
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            See exactly what's included in each plan.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="py-4 px-4 text-left text-sm font-medium text-foreground/60">
                    Feature
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-foreground">
                    Starter
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-primary">
                    Growth
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-foreground">
                    Scale
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedFeatures.map((feature, index) => (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="border-b border-border/20 hover:bg-foreground/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-foreground/80">
                      {feature.name}
                    </td>
                    <td className="py-4 px-4 text-center text-sm">
                      {renderValue(feature.starter)}
                    </td>
                    <td className="py-4 px-4 text-center text-sm bg-primary/5">
                      {renderValue(feature.growth)}
                    </td>
                    <td className="py-4 px-4 text-center text-sm">
                      {renderValue(feature.scale)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {features.length > 6 && (
            <div className="text-center mt-6">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {isExpanded ? "Show less" : `Show all ${features.length} features`}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;




