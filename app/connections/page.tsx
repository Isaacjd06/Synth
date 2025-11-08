"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, BookOpen, Mail, MessageCircle } from "lucide-react";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import ConnectionCard from "@/components/connections/ConnectionCard";
import ConnectionDialog from "@/components/connections/ConnectionDialog";
import EmptyConnections from "@/components/connections/EmptyConnections";
import DashboardLayout from "@/components/layout/DashboardLayout";

/**
 * Connections Page
 *
 * Main page for managing third-party integrations.
 * Features:
 * - Grid layout of integration cards (responsive: 3 cols desktop, 1 mobile)
 * - Staggered fade-in animation for cards
 * - Connection dialog for authorizing services
 * - Empty state when no integrations exist
 * - Mock data for Slack, Notion, Gmail, Discord
 */

// Mock integration data
interface Integration {
  id: number;
  name: string;
  status: "connected" | "disconnected";
  description: string;
  icon: any;
}

const initialIntegrations: Integration[] = [
  {
    id: 1,
    name: "Slack",
    status: "connected",
    description: "Team communication via Synth automations.",
    icon: MessageSquare,
  },
  {
    id: 2,
    name: "Notion",
    status: "disconnected",
    description: "Sync databases and notes automatically.",
    icon: BookOpen,
  },
  {
    id: 3,
    name: "Gmail",
    status: "connected",
    description: "Automate email handling and notifications.",
    icon: Mail,
  },
  {
    id: 4,
    name: "Discord",
    status: "disconnected",
    description: "Link your community or server with Synth actions.",
    icon: MessageCircle,
  },
];

export default function ConnectionsPage() {
  const [integrations, setIntegrations] =
    useState<Integration[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle connection/disconnection
  const handleConnect = (integration: Integration) => {
    if (integration.status === "disconnected") {
      // Open dialog for disconnected integrations
      setSelectedIntegration(integration);
      setIsDialogOpen(true);
    } else {
      // Directly disconnect
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === integration.id
            ? { ...int, status: "disconnected" }
            : int
        )
      );
    }
  };

  // Handle successful connection from dialog
  const handleDialogConnect = () => {
    if (selectedIntegration) {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === selectedIntegration.id
            ? { ...int, status: "connected" }
            : int
        )
      );
    }
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <ConnectionsHeader />

        {/* Main Content */}
        {integrations.length === 0 ? (
          <EmptyConnections />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8"
          >
            {integrations.map((integration) => (
              <ConnectionCard
                key={integration.id}
                name={integration.name}
                description={integration.description}
                icon={integration.icon}
                status={integration.status}
                onConnect={() => handleConnect(integration)}
              />
            ))}
          </motion.div>
        )}

        {/* Connection Dialog */}
        {selectedIntegration && (
          <ConnectionDialog
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedIntegration(null);
            }}
            integrationName={selectedIntegration.name}
            integrationIcon={selectedIntegration.icon}
            onConnect={handleDialogConnect}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
