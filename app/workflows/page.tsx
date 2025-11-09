"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkflowListPanel } from "@/components/workflows/WorkflowListPanel";
import { WorkflowCanvas } from "@/components/workflows/WorkflowCanvas";
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
 * Workflows Page - Dual-panel layout for managing automation workflows
 * Left panel: Workflow list with hover states
 * Right panel: Canvas area with workflow visualization and dotted grid
 */
export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | string | null>(null);

  const handleSelectWorkflow = (id: number | string) => {
    setSelectedWorkflowId(id);
  };

  const selectedWorkflow = mockWorkflows.find((w) => w.id === selectedWorkflowId) || null;

  return (
    <DashboardLayout>
      <div className="h-full flex bg-[#0a0a0a]">
        {/* Left Panel - Workflow List */}
        <WorkflowListPanel
          workflows={mockWorkflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={handleSelectWorkflow}
        />

        {/* Right Panel - Workflow Canvas */}
        <WorkflowCanvas selectedWorkflow={selectedWorkflow} />
      </div>
    </DashboardLayout>
  );
}
