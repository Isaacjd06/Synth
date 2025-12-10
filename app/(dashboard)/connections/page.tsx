"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plug } from "lucide-react";
import { PageTransition } from "@/components/app/PageTransition";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionPill from "@/app/(dashboard)/_components/subscription/SubscriptionPill";
import ConnectionIntegrationCard from "@/components/connections/ConnectionIntegrationCard";
import ConnectionIntegrationCardSubscribed from "@/components/connections/ConnectionIntegrationCardSubscribed";
import IntegrationDetailsDrawer from "@/components/connections/IntegrationDetailsDrawer";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationTier } from "@/components/connections/types";
import { synthToast } from "@/lib/synth-toast";

const integrations: Integration[] = [
  // Starter tier (1-18)
  { id: "gmail", name: "Gmail", description: "Send and receive emails, manage drafts and labels", icon: "Gmail", tier: "starter", category: "Communication", connected: false, permissions: ["Read emails", "Send emails", "Manage labels"], version: "v2.1" },
  { id: "google-calendar", name: "Google Calendar", description: "Create events, manage schedules and reminders", icon: "Google Calendar", tier: "starter", category: "Productivity", connected: true, permissions: ["Read events", "Create events", "Modify events"], version: "v3.0" },
  { id: "google-sheets", name: "Google Sheets", description: "Read and write spreadsheet data", icon: "Google Sheets", tier: "starter", category: "Productivity", connected: false, permissions: ["Read spreadsheets", "Edit spreadsheets"], version: "v4.0" },
  { id: "slack", name: "Slack", description: "Send messages, manage channels and workflows", icon: "Slack", tier: "starter", category: "Communication", connected: true, permissions: ["Send messages", "Read channels", "Manage workflows"], version: "v2.0" },
  { id: "notion", name: "Notion", description: "Create pages, update databases and manage content", icon: "Notion", tier: "starter", category: "Productivity", connected: false, permissions: ["Read pages", "Create pages", "Update databases"], version: "v1.0" },
  { id: "webhooks", name: "Webhooks", description: "Send and receive HTTP webhooks for custom integrations", icon: "Webhooks", tier: "starter", category: "Developer", connected: false, permissions: ["Send webhooks", "Receive webhooks"], version: "v1.0" },
  { id: "email-smtp", name: "Email (SMTP)", description: "Send emails via custom SMTP server", icon: "Email (SMTP)", tier: "starter", category: "Communication", connected: false, permissions: ["Send emails"], version: "v1.0" },
  { id: "discord", name: "Discord", description: "Send messages, manage servers and bots", icon: "Discord", tier: "starter", category: "Communication", connected: false, permissions: ["Send messages", "Manage channels", "Bot commands"], version: "v1.0" },
  { id: "stripe", name: "Stripe", description: "Manage payments, subscriptions and invoices", icon: "Stripe", tier: "starter", category: "Finance", connected: false, permissions: ["Read transactions", "Create charges", "Manage subscriptions"], version: "v2.0" },
  { id: "clickup", name: "ClickUp", description: "Manage tasks, projects and team workspaces", icon: "ClickUp", tier: "starter", category: "Productivity", connected: false, permissions: ["Read tasks", "Create tasks", "Update projects"], version: "v2.0" },
  { id: "trello", name: "Trello", description: "Manage boards, cards and team collaboration", icon: "Trello", tier: "starter", category: "Productivity", connected: false, permissions: ["Read boards", "Create cards", "Move cards"], version: "v1.0" },
  { id: "airtable", name: "Airtable", description: "Manage databases, records and automations", icon: "Airtable", tier: "starter", category: "Productivity", connected: false, permissions: ["Read records", "Create records", "Update records"], version: "v1.0" },
  { id: "google-drive", name: "Google Drive", description: "Upload, download and organize files and folders", icon: "Google Drive", tier: "starter", category: "Storage", connected: false, permissions: ["Read files", "Upload files", "Organize folders"], version: "v3.0" },
  { id: "canva", name: "Canva", description: "Create and export designs and graphics", icon: "Canva", tier: "starter", category: "Design", connected: false, permissions: ["Create designs", "Export images", "Access templates"], version: "v1.0" },
  { id: "dropbox-paper", name: "Dropbox Paper", description: "Create and collaborate on documents", icon: "Dropbox Paper", tier: "starter", category: "Productivity", connected: false, permissions: ["Read documents", "Create documents", "Share docs"], version: "v1.0" },
  { id: "google-forms", name: "Google Forms", description: "Create forms and collect responses", icon: "Google Forms", tier: "starter", category: "Productivity", connected: false, permissions: ["Create forms", "Read responses", "Manage forms"], version: "v1.0" },
  { id: "instagram-api", name: "Instagram Basic API", description: "Post content and manage basic account features", icon: "Instagram Basic API", tier: "starter", category: "Social Media", connected: false, permissions: ["Read profile", "Post media", "View insights"], version: "v1.0" },
  { id: "youtube-api", name: "YouTube API", description: "Upload videos and manage channel content", icon: "YouTube API", tier: "starter", category: "Social Media", connected: false, permissions: ["Upload videos", "Read analytics", "Manage playlists"], version: "v3.0" },
  
  // Pro tier (19-29)
  { id: "dropbox", name: "Dropbox", description: "Upload, download and manage cloud files", icon: "Dropbox", tier: "pro", category: "Storage", connected: false, permissions: ["Read files", "Upload files", "Share files"], version: "v2.0" },
  { id: "hubspot", name: "HubSpot CRM", description: "Manage contacts, deals and marketing campaigns", icon: "HubSpot CRM", tier: "pro", category: "CRM", connected: false, permissions: ["Read contacts", "Create deals", "Track campaigns"], version: "v3.0" },
  { id: "monday", name: "Monday.com", description: "Manage projects, boards and team workflows", icon: "Monday.com", tier: "pro", category: "Productivity", connected: false, permissions: ["Read boards", "Create items", "Update columns"], version: "v2.0" },
  { id: "quickbooks", name: "QuickBooks", description: "Manage invoices, expenses and financial reports", icon: "QuickBooks", tier: "pro", category: "Finance", connected: false, permissions: ["Read transactions", "Create invoices", "Generate reports"], version: "v1.0" },
  { id: "twitter", name: "Twitter (X)", description: "Post tweets and manage social interactions", icon: "Twitter (X)", tier: "pro", category: "Social Media", connected: false, permissions: ["Post tweets", "Read timeline", "Manage followers"], version: "v2.0" },
  { id: "openai", name: "OpenAI API", description: "Access GPT models for AI-powered automation", icon: "OpenAI API", tier: "pro", category: "AI", connected: false, permissions: ["Generate text", "Create embeddings", "Use models"], version: "v1.0" },
  { id: "calendly", name: "Calendly", description: "Schedule meetings and manage appointments", icon: "Calendly", tier: "pro", category: "Productivity", connected: false, permissions: ["Create events", "Read bookings", "Manage availability"], version: "v2.0" },
  { id: "make-bridge", name: "Make.com Bridge", description: "Connect with Make.com scenarios and workflows", icon: "Make.com Bridge", tier: "pro", category: "Developer", connected: false, permissions: ["Trigger scenarios", "Send data", "Receive webhooks"], version: "v1.0" },
  { id: "facebook-pages", name: "Facebook Pages API", description: "Manage page content and engagement", icon: "Facebook Pages API", tier: "pro", category: "Social Media", connected: false, permissions: ["Post content", "Read insights", "Manage comments"], version: "v1.0" },
  { id: "google-ads", name: "Google Ads", description: "Manage ad campaigns and track performance", icon: "Google Ads", tier: "pro", category: "Marketing", connected: false, permissions: ["Create campaigns", "Read reports", "Manage budgets"], version: "v1.0" },
  { id: "meta-ads", name: "Meta Ads Manager", description: "Run and optimize Facebook and Instagram ads", icon: "Meta Ads Manager", tier: "pro", category: "Marketing", connected: false, permissions: ["Create ads", "Track conversions", "Manage audiences"], version: "v1.0" },
  
  // Agency tier (30-40)
  { id: "salesforce", name: "Salesforce", description: "Manage leads, contacts and sales pipelines", icon: "Salesforce", tier: "agency", category: "CRM", connected: false, permissions: ["Read contacts", "Create leads", "Update opportunities"], version: "v1.0" },
  { id: "zoho", name: "Zoho CRM", description: "Manage sales, marketing and customer support", icon: "Zoho CRM", tier: "agency", category: "CRM", connected: false, permissions: ["Read records", "Create leads", "Update deals"], version: "v2.0" },
  { id: "zapier", name: "Zapier Handoff", description: "Connect with 5000+ apps through Zapier", icon: "Zapier Handoff", tier: "agency", category: "Developer", connected: false, permissions: ["Trigger zaps", "Receive data"], version: "v1.0" },
  { id: "shopify", name: "Shopify Admin API", description: "Manage products, orders and store settings", icon: "Shopify Admin API", tier: "agency", category: "E-commerce", connected: false, permissions: ["Read orders", "Manage products", "Update inventory"], version: "v1.0" },
  { id: "aws-s3", name: "AWS S3", description: "Store and retrieve files from Amazon S3 buckets", icon: "AWS S3", tier: "agency", category: "Storage", connected: false, permissions: ["Read objects", "Upload files", "Manage buckets"], version: "v1.0" },
  { id: "azure-blob", name: "Azure Blob Storage", description: "Manage files in Microsoft Azure storage", icon: "Azure Blob Storage", tier: "agency", category: "Storage", connected: false, permissions: ["Read blobs", "Upload files", "Manage containers"], version: "v1.0" },
  { id: "gcs", name: "Google Cloud Storage", description: "Store and manage files in Google Cloud", icon: "Google Cloud Storage", tier: "agency", category: "Storage", connected: false, permissions: ["Read objects", "Upload files", "Manage buckets"], version: "v1.0" },
  { id: "ms-teams", name: "Microsoft Teams", description: "Send messages and manage team channels", icon: "Microsoft Teams", tier: "agency", category: "Communication", connected: false, permissions: ["Send messages", "Create channels", "Manage teams"], version: "v1.0" },
  { id: "jira", name: "Jira", description: "Manage issues, sprints and project tracking", icon: "Jira", tier: "agency", category: "Productivity", connected: false, permissions: ["Create issues", "Update sprints", "Read projects"], version: "v3.0" },
  { id: "servicenow", name: "ServiceNow", description: "Manage IT service requests and incidents", icon: "ServiceNow", tier: "agency", category: "Enterprise", connected: false, permissions: ["Create incidents", "Update tickets", "Read workflows"], version: "v1.0" },
  { id: "oracle-cloud", name: "Oracle Cloud Storage", description: "Enterprise cloud storage and data management", icon: "Oracle Cloud Storage", tier: "agency", category: "Storage", connected: false, permissions: ["Read objects", "Upload files", "Manage buckets"], version: "v1.0" },
];

// Filter options for gated (unsubscribed) version - no "Coming Soon"
const gatedFilterOptions = ["All", "Starter", "Pro", "Agency"] as const;
// Filter options for subscribed version - no "Coming Soon" (matching Lovable)
const subscribedFilterOptions = ["All", "Starter", "Pro", "Agency"] as const;
type FilterOption = typeof gatedFilterOptions[number] | typeof subscribedFilterOptions[number];

export default function ConnectionsPage() {
  const { isSubscribed, plan } = useSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations);

  const isIntegrationLocked = (tier: IntegrationTier): boolean => {
    if (!isSubscribed || plan === "none") return true;
    
    const tierLevel: Record<string, number> = { starter: 1, pro: 2, agency: 3 };
    const userLevel = tierLevel[plan] || 0;
    const requiredLevel = tierLevel[tier] || 0;
    
    return userLevel < requiredLevel;
  };

  const getUpgradeMessage = (tier: IntegrationTier): string => {
    if (!isSubscribed) return "Subscribe to unlock integrations";
    if (tier === "pro") return "Upgrade to Pro or Agency";
    if (tier === "agency") return "Available on Agency plan";
    return "Upgrade Plan";
  };

  const filteredIntegrations = useMemo(() => {
    const sourceIntegrations = isSubscribed ? integrationsState : integrations;
    return sourceIntegrations.filter((integration) => {
      // Search filter
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      let matchesFilter = true;
      if (activeFilter === "Starter") matchesFilter = integration.tier === "starter";
      else if (activeFilter === "Pro") matchesFilter = integration.tier === "pro";
      else if (activeFilter === "Agency") matchesFilter = integration.tier === "agency";
      // Note: "Coming Soon" filter removed from both versions
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, isSubscribed, integrationsState]);

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.comingSoon) return;
    setSelectedIntegration(integration);
    setDrawerOpen(true);
  };

  // Subscribed version handlers (from Lovable)
  const handleConnect = (integrationId: string) => {
    setIntegrationsState(prev => 
      prev.map(i => i.id === integrationId ? { ...i, connected: true } : i)
    );
    const integration = integrationsState.find(i => i.id === integrationId);
    synthToast.success("Connected", `${integration?.name || "Integration"} has been connected successfully.`);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrationsState(prev => 
      prev.map(i => i.id === integrationId ? { ...i, connected: false } : i)
    );
    const integration = integrationsState.find(i => i.id === integrationId);
    synthToast.success("Disconnected", `${integration?.name || "Integration"} has been disconnected.`);
  };

  const connectedCount = integrationsState.filter(i => i.connected).length;
  const filterOptions = isSubscribed ? subscribedFilterOptions : gatedFilterOptions;

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-3"
              >
                <Plug className="w-8 h-8 text-primary" />
                Connections
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mt-2"
              >
                {isSubscribed 
                  ? "Connect the apps Synth can use inside your automations."
                  : "Manage the apps Synth can use inside your automations"
                }
              </motion.p>
            </div>
            <SubscriptionPill plan={plan} isSubscribed={isSubscribed} />
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card/50 border-border/60 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </motion.div>

          {/* Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary))]"
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
                )}
              >
                {filter}
              </button>
            ))}
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-6 text-sm"
          >
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{filteredIntegrations.length}</span> integrations
            </span>
            <span className="text-muted-foreground">
              <span className="text-green-400 font-medium">
                {isSubscribed ? connectedCount : integrations.filter(i => i.connected).length}
              </span> connected
            </span>
          </motion.div>

          {/* Integrations Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {isSubscribed ? (
              // Subscribed version - Lovable UI with Connect/Disconnect buttons
              filteredIntegrations.map((integration, index) => (
                <ConnectionIntegrationCardSubscribed
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.id)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                  index={index}
                />
              ))
            ) : (
              // Gated version - existing UI with locking and drawer
              filteredIntegrations.map((integration, index) => (
                <ConnectionIntegrationCard
                  key={integration.id}
                  integration={integration}
                  isLocked={isIntegrationLocked(integration.tier)}
                  upgradeMessage={getUpgradeMessage(integration.tier)}
                  onClick={() => handleIntegrationClick(integration)}
                  index={index}
                />
              ))
            )}
          </motion.div>

          {/* Empty State */}
          {filteredIntegrations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No integrations found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter</p>
            </motion.div>
          )}
        </div>

        {/* Integration Details Drawer - Only show for gated (unsubscribed) version */}
        {!isSubscribed && (
          <IntegrationDetailsDrawer
            integration={selectedIntegration}
            isLocked={selectedIntegration ? isIntegrationLocked(selectedIntegration.tier) : false}
            upgradeMessage={selectedIntegration ? getUpgradeMessage(selectedIntegration.tier) : ""}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </PageTransition>
  );
}

