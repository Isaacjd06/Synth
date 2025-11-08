"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkflowHeader } from "@/components/workflows/WorkflowHeader";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { EmptyState } from "@/components/workflows/EmptyState";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Mock workflow data - will be replaced with actual data from Supabase + n8n later
const mockWorkflows = [
  {
    id: 1,
    name: "Email Notification Flow",
    description: "Triggers when a form is submitted and sends notifications.",
    status: "Active" as const,
    lastRun: "2 hours ago",
    nodes: [
      { id: "trigger", label: "Form Submitted" },
      { id: "action1", label: "Send Slack" },
      { id: "action2", label: "Send Email" },
    ],
  },
  {
    id: 2,
    name: "Lead Capture Automation",
    description: "Captures new leads and stores them in Supabase.",
    status: "Inactive" as const,
    lastRun: "Yesterday",
    nodes: [
      { id: "trigger", label: "New Lead Captured" },
      { id: "action1", label: "Save to Database" },
    ],
  },
  {
    id: 3,
    name: "Customer Onboarding",
    description: "Automated welcome sequence for new customers.",
    status: "Active" as const,
    lastRun: "5 minutes ago",
    nodes: [
      { id: "trigger", label: "New Signup" },
      { id: "action1", label: "Send Welcome Email" },
      { id: "action2", label: "Create Profile" },
      { id: "action3", label: "Notify Team" },
    ],
  },
  {
    id: 4,
    name: "Weekly Report Generator",
    description: "Generates and emails weekly analytics reports.",
    status: "Active" as const,
    lastRun: "3 days ago",
    nodes: [
      { id: "trigger", label: "Weekly Trigger" },
      { id: "action1", label: "Fetch Analytics" },
      { id: "action2", label: "Generate PDF" },
      { id: "action3", label: "Email Report" },
    ],
  },
  {
    id: 5,
    name: "Social Media Scheduler",
    description: "Schedules and posts content across platforms.",
    status: "Inactive" as const,
    lastRun: "1 week ago",
    nodes: [
      { id: "trigger", label: "Content Ready" },
      { id: "action1", label: "Post to Twitter" },
      { id: "action2", label: "Post to LinkedIn" },
    ],
  },
];

/**
 * Workflows Page - Main dashboard for managing automation workflows
 * Displays workflow cards in a responsive grid with search and filter capabilities
 */
export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      workflow.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Event handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setFilterStatus(filter);
  };

  const handleCreateWorkflow = () => {
    console.log("Create workflow clicked");
    // TODO: Navigate to workflow builder or open modal
  };

  const handleViewWorkflow = (id: number | string) => {
    console.log("View workflow:", id);
    // TODO: Navigate to workflow detail page
  };

  const handleEditWorkflow = (id: number | string) => {
    console.log("Edit workflow:", id);
    // TODO: Navigate to workflow editor
  };

  const handleRunWorkflow = (id: number | string) => {
    console.log("Run workflow:", id);
    // TODO: Trigger workflow execution via API
  };

  const handleDeleteWorkflow = (id: number | string) => {
    console.log("Delete workflow:", id);
    // TODO: Show confirmation dialog and delete via API
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <WorkflowHeader
          onSearch={handleSearch}
          onCreateWorkflow={handleCreateWorkflow}
          onFilterChange={handleFilterChange}
        />

        {/* Main Content */}
        <div className="p-8">
          {filteredWorkflows.length === 0 ? (
            // Empty State
            <EmptyState onCreateWorkflow={handleCreateWorkflow} />
          ) : (
            // Workflow Grid
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {filteredWorkflows.map((workflow, index) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  index={index}
                  onView={handleViewWorkflow}
                  onEdit={handleEditWorkflow}
                  onRun={handleRunWorkflow}
                  onDelete={handleDeleteWorkflow}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Background Gradient Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top gradient */}
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-[#0229bf]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Bottom gradient */}
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0229bf]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
