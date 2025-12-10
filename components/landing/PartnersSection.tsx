"use client";
import { motion } from "framer-motion";

const partners = [
  "Zapier", "Slack", "Notion", "Google Workspace", "HubSpot", 
  "Shopify", "Pipedream", "Airtable", "Trello", "Asana",
  "Salesforce", "Microsoft 365", "Stripe", "Mailchimp"
];

const PartnersSection = () => {
  return (
    <section id="partners" className="py-10 relative overflow-hidden bg-[#080808]">
      {/* Fade transition at top */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#050505] to-transparent" />
      
      <div className="container px-6 mb-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm text-foreground/40 uppercase tracking-widest"
        >
          Trusted by teams who automate at scale
        </motion.p>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#080808] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#080808] to-transparent z-10" />
        
        {/* Scrolling logos */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex items-center gap-16 pr-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...partners, ...partners].map((partner, i) => (
              <div
                key={i}
                className="flex-shrink-0 text-foreground/25 text-xl font-display tracking-tight whitespace-nowrap hover:text-foreground/40 transition-colors"
              >
                {partner}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Fade transition at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
};

export default PartnersSection;



