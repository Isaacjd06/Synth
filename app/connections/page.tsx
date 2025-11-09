"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, BookOpen, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import ConnectionCard from "@/components/connections/ConnectionCard";
import AddIntegrationCard from "@/components/connections/AddIntegrationCard";
import ConnectionDialog from "@/components/connections/ConnectionDialog";
import EmptyConnections from "@/components/connections/EmptyConnections";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";

/**
 * Connections Page - Premium Redesign
 *
 * Modern SaaS integrations dashboard with professional styling.
 * Features:
 * - Premium dark gradient cards with smooth animations
 * - Responsive grid layout (1/2/3 columns)
 * - Staggered fade-in animations
 * - Toast notifications for actions
 * - Status summary in header
 * - "Add Integration" card for future expansions
 * - Vercel/Linear-inspired design aesthetic
 */

// Integration data interface
interface Integration {
  id: number;
  name: string;
  status: "connected" | "disconnected";
  description: string;
  icon: any;
}

// Mock integration data
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

  // Calculate connection stats
  const { connectedCount, disconnectedCount } = useMemo(() => {
    const connected = integrations.filter((i) => i.status === "connected").length;
    const disconnected = integrations.filter((i) => i.status === "disconnected").length;
    return { connectedCount: connected, disconnectedCount: disconnected };
  }, [integrations]);

  // Handle connection/disconnection with toast notifications
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

      // Show toast notification
      toast.success(`${integration.name} disconnected successfully`, {
        description: "You can reconnect anytime from this page.",
      });
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

      // Show toast notification
      toast.success(`${selectedIntegration.name} connected successfully`, {
        description: "Your integration is now active.",
      });
    }
  };

  // Handle add integration click
  const handleAddIntegration = () => {
    toast.info("Coming soon", {
      description: "Additional integrations will be available soon.",
    });
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Toast notifications */}
        <Toaster position="bottom-right" />

        {/* Header */}
        <ConnectionsHeader
          connectedCount={connectedCount}
          disconnectedCount={disconnectedCount}
        />

        {/* Main Content */}
        {integrations.length === 0 ? (
          <EmptyConnections />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8"
          >
            {/* Integration Cards */}
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

            {/* Add Integration Card */}
            <AddIntegrationCard onClick={handleAddIntegration} />
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
