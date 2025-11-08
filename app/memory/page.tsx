"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MemoryHeader from "@/components/memory/MemoryHeader";
import MemoryCard from "@/components/memory/MemoryCard";
import MemoryDialog from "@/components/memory/MemoryDialog";
import EmptyMemory from "@/components/memory/EmptyMemory";
import DashboardLayout from "@/components/layout/DashboardLayout";

/**
 * Memory Page
 *
 * Central visualization of Synth's stored memories.
 * Displays user memories including insights, preferences, and system data.
 * Features:
 * - Animated grid layout with staggered card entrance
 * - Search and filter functionality
 * - Modal dialog for viewing/editing memories
 * - Empty state when no memories exist
 * - Neural-inspired design with blue glow effects
 */

// Memory type definition
interface Memory {
  id: number;
  key: string;
  type: "Insight" | "Preference" | "System";
  value: string;
  updated_at: string;
}

// Mock memory data - will be replaced with Supabase data later
const mockMemories: Memory[] = [
  {
    id: 1,
    key: "preferred_work_hours",
    type: "Preference",
    value: "You tend to focus best from 8am to 2pm. This is when you're most productive and prefer to tackle complex tasks.",
    updated_at: "2 hours ago",
  },
  {
    id: 2,
    key: "communication_style",
    type: "Insight",
    value: "You prefer concise, practical language over emotional tone. You value efficiency in communication and appreciate direct, actionable information.",
    updated_at: "Yesterday",
  },
  {
    id: 3,
    key: "project_focus",
    type: "System",
    value: "You've been primarily focused on building Synth's automation engine, with emphasis on workflow orchestration and n8n integration.",
    updated_at: "3 days ago",
  },
  {
    id: 4,
    key: "notification_preferences",
    type: "Preference",
    value: "You prefer minimal notifications, only for critical updates. Batch notifications are preferred over real-time alerts.",
    updated_at: "1 week ago",
  },
  {
    id: 5,
    key: "design_philosophy",
    type: "Insight",
    value: "You gravitate towards dark, minimal interfaces with blue accents. Vercel-style aesthetics resonate with your design preferences.",
    updated_at: "5 days ago",
  },
  {
    id: 6,
    key: "tech_stack_preference",
    type: "System",
    value: "Primary stack: Next.js (App Router), TypeScript, TailwindCSS, Framer Motion, shadcn/ui. You prefer modern, type-safe tooling.",
    updated_at: "1 week ago",
  },
  {
    id: 7,
    key: "learning_style",
    type: "Insight",
    value: "You learn best through hands-on experimentation and building. You prefer examples over lengthy documentation.",
    updated_at: "4 days ago",
  },
  {
    id: 8,
    key: "automation_goals",
    type: "Preference",
    value: "You aim to automate repetitive tasks and create intelligent workflows that adapt to patterns. Focus on AI-enhanced automation.",
    updated_at: "6 days ago",
  },
];

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>(mockMemories);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Filter memories based on search and type
  const filteredMemories = memories.filter((memory) => {
    const matchesSearch =
      memory.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.value.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      memory.type.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Handle viewing a memory
  const handleViewMemory = (id: number | string) => {
    const memory = memories.find((m) => m.id === id);
    if (memory) {
      setSelectedMemory(memory);
      setIsDialogOpen(true);
    }
  };

  // Handle saving edited memory
  const handleSaveMemory = (id: number | string, newValue: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, value: newValue, updated_at: "Just now" }
          : m
      )
    );
  };

  // Handle deleting a memory
  const handleDeleteMemory = (id: number | string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setIsDialogOpen(false);
    setSelectedMemory(null);
  };

  // Handle getting started (navigate to workflows or dashboard)
  const handleGetStarted = () => {
    console.log("Navigate to workflows or dashboard");
    // TODO: Add navigation logic
  };

  // Stagger animation for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen bg-[#0a0a0a]"
      >
        {/* Header */}
        <MemoryHeader
          onSearch={setSearchQuery}
          onFilterChange={setFilterType}
        />

        {/* Main Content */}
        {filteredMemories.length === 0 ? (
          // Empty State
          <EmptyMemory onGetStarted={handleGetStarted} />
        ) : (
          // Memory Grid
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8"
          >
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                id={memory.id}
                memoryKey={memory.key}
                type={memory.type}
                value={memory.value}
                updatedAt={memory.updated_at}
                onView={handleViewMemory}
              />
            ))}
          </motion.div>
        )}

        {/* Memory Dialog */}
        <MemoryDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedMemory(null);
          }}
          memory={selectedMemory}
          onSave={handleSaveMemory}
          onDelete={handleDeleteMemory}
        />

        {/* Background Gradient Effects - Neural Atmosphere */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top Left Gradient */}
          <motion.div
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0229bf]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Bottom Right Gradient */}
          <motion.div
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#0229bf]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />

          {/* Center Gradient */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.5,
            }}
          />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
