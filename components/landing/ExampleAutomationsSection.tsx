"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Mail, 
  FileText, 
  Calendar, 
  Bell, 
  Database, 
  Share2,
  MessageSquare,
  PieChart,
  Play,
  ArrowRight
} from "lucide-react";

const automations = [
  {
    icon: Mail,
    title: "Smart Email Routing",
    description: "Trigger: Incoming email → Transform: Categorize & extract → Execute: Route to team",
    type: "trigger",
  },
  {
    icon: FileText,
    title: "Document Processing",
    description: "Trigger: Document uploaded → Transform: Extract data → Execute: Sync to systems",
    type: "transformer",
  },
  {
    icon: Calendar,
    title: "Meeting Intelligence",
    description: "Trigger: Meeting ends → Transform: Parse notes → Execute: Create tasks & follow-ups",
    type: "orchestrator",
  },
  {
    icon: Bell,
    title: "Alert Orchestration",
    description: "Trigger: Event detected → Transform: Assess priority → Execute: Notify right person",
    type: "trigger",
  },
  {
    icon: Database,
    title: "Data Synchronization",
    description: "Trigger: Data changed → Transform: Map fields → Execute: Update all connected tools",
    type: "transformer",
  },
  {
    icon: Share2,
    title: "Cross-Platform Flows",
    description: "Trigger: Action in App A → Transform: Process → Execute: Actions in Apps B, C, D",
    type: "orchestrator",
  },
  {
    icon: MessageSquare,
    title: "Customer Response",
    description: "Trigger: New inquiry → Transform: Context lookup → Execute: Draft personalized reply",
    type: "trigger",
  },
  {
    icon: PieChart,
    title: "Report Generation",
    description: "Trigger: Schedule/request → Transform: Aggregate data → Execute: Generate & distribute",
    type: "transformer",
  },
];

const typeColors = {
  trigger: "from-emerald-500/20 to-emerald-500/5",
  transformer: "from-primary/20 to-primary/5",
  orchestrator: "from-violet-500/20 to-violet-500/5",
};

const ExampleAutomationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-20 relative overflow-hidden">
      {/* Background with alternating gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synth-navy/40 to-transparent" />
      
      {/* Neural network nodes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/25"
            style={{
              left: `${15 + i * 18}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{ 
              scale: [1, 1.5, 1], 
              opacity: [0.2, 0.5, 0.2] 
            }}
            transition={{ 
              duration: 5 + i, 
              repeat: Infinity,
              delay: i * 0.7,
            }}
          />
        ))}
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-nodes opacity-25" />
      
      <div className="container px-6 relative z-10">
        <div className="text-center mb-12 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-sm font-accent text-primary uppercase tracking-widest mb-6"
          >
            Workflow Library
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display-bold tracking-tight text-foreground max-w-3xl mx-auto"
          >
            Endless possibilities, <span className="text-gradient-accent">zero limits</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-foreground/60 max-w-xl mx-auto"
          >
            Each automation follows the pattern: <span className="text-primary/80">Trigger</span> → <span className="text-foreground/80">Transform</span> → <span className="text-primary/80">Execute</span>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {automations.map((automation, index) => (
            <motion.div
              key={automation.title}
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.07 }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="group h-full p-6 rounded-xl card-node relative overflow-hidden"
              >
                {/* Type indicator gradient */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${typeColors[automation.type as keyof typeof typeColors]} opacity-0 group-hover:opacity-100 transition-opacity duration-400`} />
                
                {/* Icon as workflow node */}
                <div className="relative mb-5">
                  <motion.div 
                    className="w-11 h-11 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/15 group-hover:border-primary/30 icon-node"
                    whileHover={{ scale: 1.05 }}
                  >
                    <automation.icon className="w-5 h-5 text-primary" />
                  </motion.div>
                  
                  {/* Flow indicator */}
                  <motion.div
                    className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <ArrowRight className="w-3 h-3 text-primary/40" />
                  </motion.div>
                </div>
                
                <h3 className="text-base font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {automation.title}
                </h3>
                
                <p className="text-sm text-foreground/55 leading-relaxed">
                  {automation.description}
                </p>
                
                {/* Workflow activation glow on hover */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, transparent, hsl(217 100% 60% / 0.03), transparent)",
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
                
                {/* Perimeter glow path on hover */}
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/15 transition-all duration-400 pointer-events-none" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleAutomationsSection;



