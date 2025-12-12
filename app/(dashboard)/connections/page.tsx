"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plug, Lock } from "lucide-react";
import { PageTransition } from "@/components/app/PageTransition";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionPill from "@/app/(dashboard)/_components/subscription/SubscriptionPill";
import ConnectionIntegrationCard from "@/components/connections/ConnectionIntegrationCard";
import ConnectionIntegrationCardSubscribed from "@/components/connections/ConnectionIntegrationCardSubscribed";
import IntegrationDetailsDrawer from "@/components/connections/IntegrationDetailsDrawer";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationTier } from "@/components/connections/types";
import { synthToast } from "@/lib/synth-toast";

// Exact integration list with proper ordering as specified - 40 total integrations
const ALL_INTEGRATIONS: Integration[] = [
  // STARTER PLAN INTEGRATIONS (1-15)
  { id: "gmail", name: "Gmail", description: "Send and receive emails, manage drafts and labels", icon: "Gmail", tier: "starter", category: "Communication", connected: false },
  { id: "google-calendar", name: "Google Calendar", description: "Create events, manage schedules and reminders", icon: "Google Calendar", tier: "starter", category: "Productivity", connected: false },
  { id: "google-sheets", name: "Google Sheets", description: "Read and write spreadsheet data", icon: "Google Sheets", tier: "starter", category: "Productivity", connected: false },
  { id: "google-drive", name: "Google Drive", description: "Upload, download and organize files and folders", icon: "Google Drive", tier: "starter", category: "Storage", connected: false },
  { id: "google-forms", name: "Google Forms", description: "Create forms and collect responses", icon: "Google Forms", tier: "starter", category: "Productivity", connected: false },
  { id: "email-smtp", name: "Email (SMTP)", description: "Send emails via custom SMTP server", icon: "Email (SMTP)", tier: "starter", category: "Communication", connected: false },
  { id: "webhooks", name: "Standard Webhooks", description: "Send and receive HTTP webhooks for custom integrations", icon: "Webhooks", tier: "starter", category: "Developer", connected: false },
  { id: "slack", name: "Slack", description: "Send messages, manage channels and workflows", icon: "Slack", tier: "starter", category: "Communication", connected: false },
  { id: "discord", name: "Discord", description: "Send messages, manage servers and bots", icon: "Discord", tier: "starter", category: "Communication", connected: false },
  { id: "zoom", name: "Zoom", description: "Schedule meetings, manage recordings and participants", icon: "Zoom", tier: "starter", category: "Communication", connected: false },
  { id: "microsoft-outlook", name: "Microsoft Outlook", description: "Send and receive emails, manage calendar and contacts", icon: "Microsoft Outlook", tier: "starter", category: "Communication", connected: false },
  { id: "microsoft-onedrive", name: "Microsoft OneDrive", description: "Upload, download and organize files in the cloud", icon: "Microsoft OneDrive", tier: "starter", category: "Storage", connected: false },
  { id: "microsoft-todo", name: "Microsoft To Do", description: "Manage tasks, lists and reminders", icon: "Microsoft To Do", tier: "starter", category: "Productivity", connected: false },
  { id: "evernote", name: "Evernote", description: "Create notes, organize content and capture ideas", icon: "Evernote", tier: "starter", category: "Productivity", connected: false },
  { id: "todoist", name: "Todoist", description: "Manage tasks, projects and productivity workflows", icon: "Todoist", tier: "starter", category: "Productivity", connected: false },
  
  // PRO PLAN INTEGRATIONS (16-30) - includes all Starter + these
  { id: "notion", name: "Notion", description: "Create pages, update databases and manage content", icon: "Notion", tier: "pro", category: "Productivity", connected: false },
  { id: "airtable", name: "Airtable", description: "Manage databases, records and automations", icon: "Airtable", tier: "pro", category: "Productivity", connected: false },
  { id: "trello", name: "Trello", description: "Manage boards, cards and team collaboration", icon: "Trello", tier: "pro", category: "Productivity", connected: false },
  { id: "clickup", name: "ClickUp", description: "Manage tasks, projects and team workspaces", icon: "ClickUp", tier: "pro", category: "Productivity", connected: false },
  { id: "monday", name: "Monday.com", description: "Manage projects, boards and team workflows", icon: "Monday.com", tier: "pro", category: "Productivity", connected: false },
  { id: "asana", name: "Asana", description: "Manage projects, tasks and team collaboration", icon: "Asana", tier: "pro", category: "Productivity", connected: false },
  { id: "dropbox-paper", name: "Dropbox Paper", description: "Create and collaborate on documents", icon: "Dropbox Paper", tier: "pro", category: "Productivity", connected: false },
  { id: "dropbox-core", name: "Dropbox Core", description: "Upload, download and manage cloud files", icon: "Dropbox Core", tier: "pro", category: "Storage", connected: false },
  { id: "canva", name: "Canva", description: "Create and export designs and graphics", icon: "Canva", tier: "pro", category: "Design", connected: false },
  { id: "typeform", name: "Typeform", description: "Create interactive forms and collect responses", icon: "Typeform", tier: "pro", category: "Productivity", connected: false },
  { id: "hubspot-crm", name: "HubSpot CRM", description: "Manage contacts, deals and marketing campaigns", icon: "HubSpot CRM", tier: "pro", category: "CRM", connected: false },
  { id: "salesforce-essentials", name: "Salesforce Essentials", description: "Manage leads, contacts and sales pipelines", icon: "Salesforce Essentials", tier: "pro", category: "CRM", connected: false },
  { id: "intercom", name: "Intercom", description: "Manage customer conversations and support tickets", icon: "Intercom", tier: "pro", category: "CRM", connected: false },
  { id: "calendly", name: "Calendly", description: "Schedule meetings and manage appointments", icon: "Calendly", tier: "pro", category: "Productivity", connected: false },
  { id: "webflow", name: "Webflow", description: "Manage website content and publish updates", icon: "Webflow", tier: "pro", category: "Design", connected: false },
  
  // AGENCY PLAN INTEGRATIONS (31-40) - includes all Starter + Pro + these
  { id: "stripe", name: "Stripe", description: "Manage payments, subscriptions and invoices", icon: "Stripe", tier: "agency", category: "Finance", connected: false },
  { id: "quickbooks", name: "QuickBooks", description: "Manage invoices, expenses and financial reports", icon: "QuickBooks", tier: "agency", category: "Finance", connected: false },
  { id: "xero", name: "Xero", description: "Manage accounting, invoices and financial data", icon: "Xero", tier: "agency", category: "Finance", connected: false },
  { id: "shopify", name: "Shopify", description: "Manage products, orders and store settings", icon: "Shopify", tier: "agency", category: "E-commerce", connected: false },
  { id: "woocommerce", name: "WooCommerce", description: "Manage products, orders and e-commerce operations", icon: "WooCommerce", tier: "agency", category: "E-commerce", connected: false },
  { id: "custom-http-integrations", name: "Custom HTTP Integrations", description: "Advanced webhooks expansion with custom authentication and retry logic", icon: "Custom HTTP Integrations", tier: "agency", category: "Developer", connected: false },
  { id: "highlevel", name: "HighLevel", description: "Manage CRM, marketing automation and client communications", icon: "HighLevel", tier: "agency", category: "CRM", connected: false },
  { id: "make-connector", name: "Make.com Connector", description: "Connect with Make.com scenarios and workflows (Limited Access)", icon: "Make.com Connector", tier: "agency", category: "Developer", connected: false },
  { id: "linkedin-lead-gen", name: "LinkedIn Lead Gen", description: "Capture and manage LinkedIn lead generation forms", icon: "LinkedIn Lead Gen", tier: "agency", category: "Marketing", connected: false },
  { id: "meta-lead-ads", name: "Meta (Facebook/Instagram) Lead Ads", description: "Capture and manage Facebook and Instagram lead ads", icon: "Meta (Facebook/Instagram) Lead Ads", tier: "agency", category: "Marketing", connected: false },
];

const filterOptions = ["All", "Starter", "Pro", "Agency"] as const;
type FilterOption = typeof filterOptions[number];

// Tier level mapping for access control
const tierLevel: Record<IntegrationTier, number> = {
  starter: 1,
  pro: 2,
  agency: 3,
};

const planTierLevel: Record<string, number> = {
  starter: 1,
  pro: 2,
  agency: 3,
  free: 0,
  none: 0,
};

export default function ConnectionsPage() {
  const { isSubscribed, plan, subscriptionStatus, isLoading } = useSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [allowedIntegrationIds, setAllowedIntegrationIds] = useState<string[]>([]);

  // Fetch user's subscription plan and allowed integrations from backend
  // This should sync with the subscription context, but we need it for allowedIntegrationIds
  useEffect(() => {
    // Wait for subscription context to load first
    if (isLoading) {
      return;
    }

    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch("/api/billing/state");
        if (response.ok) {
          const data = await response.json();
          // Get allowed integrations based on plan
          const planName = data.plan || "free";
          const status = data.subscriptionStatus || "UNSUBSCRIBED";
          
          // Only set allowed integrations if user is SUBSCRIBED
          if (status === "SUBSCRIBED" && planName && planName !== "free") {
            let allowedIds: string[] = [];
            if (planName === "starter") {
              allowedIds = ALL_INTEGRATIONS.filter(i => i.tier === "starter").map(i => i.id);
            } else if (planName === "pro") {
              allowedIds = ALL_INTEGRATIONS.filter(i => i.tier === "starter" || i.tier === "pro").map(i => i.id);
            } else if (planName === "agency") {
              allowedIds = ALL_INTEGRATIONS.map(i => i.id); // All 40 integrations
            }
            
            setAllowedIntegrationIds(allowedIds);
          } else {
            // User is not subscribed or on free plan - no integrations allowed
            setAllowedIntegrationIds([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        setAllowedIntegrationIds([]);
      }
    };

    fetchSubscriptionData();
  }, [isLoading, plan, subscriptionStatus]);

  // Fetch user's connections from backend
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoadingConnections(true);
        const response = await fetch("/api/connections/status");
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Non-JSON response from /api/connections/status");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data && data.ok && data.data) {
            const connectionsList = data.data.connections || [];
            
            // Map backend connections to integration IDs
            const connectedServiceNames = new Set(
              connectionsList
                .filter((conn: any) => conn.connected)
                .map((conn: any) => conn.service_name?.toLowerCase())
            );
            
            // Update integrations with connection status
            setIntegrations(prev => prev.map(integration => {
              // Match by service name (case-insensitive)
              const isConnected = connectedServiceNames.has(integration.name.toLowerCase()) ||
                connectedServiceNames.has(integration.id.toLowerCase());
              return { ...integration, connected: isConnected };
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch connections:", error);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    fetchConnections();
  }, []);

  // Determine if integration is locked based on subscription status and plan
  // This function is memoized to prevent unnecessary recalculations
  const isIntegrationLocked = useCallback((integration: Integration): boolean => {
    // If subscription data is still loading, show as locked (safer default)
    if (isLoading) {
      return true;
    }
    
    // If user is explicitly unsubscribed, ALL integrations are locked
    if (subscriptionStatus === "UNSUBSCRIBED") {
      return true;
    }
    
    // If plan is free or not set, all integrations are locked (view-only)
    if (!plan || plan === "free") {
      return true;
    }
    
    // If user is SUBSCRIBED, check plan-based access
    if (subscriptionStatus === "SUBSCRIBED" || isSubscribed) {
      // First, try using allowed integration IDs (most accurate)
      if (allowedIntegrationIds.length > 0) {
        const isAllowed = allowedIntegrationIds.includes(integration.id);
        return !isAllowed;
      }
      
      // Fallback: check tier access based on plan (use this if allowedIntegrationIds not set yet)
      if (plan === "starter" || plan === "pro" || plan === "agency") {
        const userLevel = planTierLevel[plan] || 0;
        const requiredLevel = tierLevel[integration.tier] || 0;
        const locked = userLevel < requiredLevel;
        return locked;
      }
    }
    
    // Default: if we can't determine subscription status, lock it (safer)
    return true;
  }, [isLoading, subscriptionStatus, plan, isSubscribed, allowedIntegrationIds]);

  const getRequiredPlan = (integration: Integration): string => {
    return integration.tier.charAt(0).toUpperCase() + integration.tier.slice(1);
  };

  const getUpgradeMessage = (tier: IntegrationTier): string => {
    if (!isSubscribed || subscriptionStatus === "UNSUBSCRIBED") return "Subscribe to unlock integrations";
    if (plan === "free") return "Upgrade to connect";
    if (tier === "pro") return "Upgrade to Pro or Agency";
    if (tier === "agency") return "Available on Agency plan";
    return "Upgrade Plan";
  };

  // Filter integrations based on search and active filter
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(integration => 
        integration.name.toLowerCase().includes(searchLower) ||
        integration.description.toLowerCase().includes(searchLower) ||
        integration.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply tier filter (only for unsubscribed view)
    if (subscriptionStatus === "UNSUBSCRIBED" && activeFilter !== "All") {
      if (activeFilter === "Starter") {
        filtered = filtered.filter(i => i.tier === "starter");
      } else if (activeFilter === "Pro") {
        filtered = filtered.filter(i => i.tier === "pro");
      } else if (activeFilter === "Agency") {
        filtered = filtered.filter(i => i.tier === "agency");
      }
    }

    // For subscribed users (including free plan), show ALL integrations
    // Free plan users can VIEW everything but can't USE anything (all locked)
    // Paid plan users see all integrations, but only can access ones in their tier
    // We don't filter out integrations here - we just lock them based on plan

    return filtered;
  }, [searchQuery, activeFilter, integrations, subscriptionStatus]);

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.comingSoon) return;
    setSelectedIntegration(integration);
    setDrawerOpen(true);
  };

  // Connect handler - redirects to OAuth start endpoint
  const handleConnect = async (serviceName: string) => {
    if (!isSubscribed || subscriptionStatus === "UNSUBSCRIBED") {
      synthToast.error("Subscription Required", "Please subscribe to connect integrations.");
      return;
    }

    // Redirect to start endpoint (GET with query param)
    // The backend will handle plan gating and redirect to provider OAuth
    window.location.href = `/api/connections/start?service=${encodeURIComponent(serviceName)}`;
  };

  // Disconnect handler - calls backend route
  const handleDisconnect = async (serviceName: string) => {
    try {
      const deleteResponse = await fetch(`/api/connections/${encodeURIComponent(serviceName)}`, {
        method: "DELETE",
      });

      // Check if response is JSON before parsing
      const contentType = deleteResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        synthToast.error("Disconnect Failed", "Unexpected response from server. Please try again.");
        return;
      }

      if (deleteResponse.ok) {
        const data = await deleteResponse.json();
        if (data && data.ok) {
          // Update local state
          setIntegrations(prev => prev.map(i => 
            i.name.toLowerCase() === serviceName.toLowerCase() ||
            i.id.toLowerCase() === serviceName.toLowerCase()
              ? { ...i, connected: false } 
              : i
          ));
          synthToast.success("Disconnected", `${serviceName} has been disconnected.`);
          
          // Refresh connections status
          const statusResponse = await fetch("/api/connections/status");
          const statusContentType = statusResponse.headers.get("content-type");
          if (statusResponse.ok && statusContentType && statusContentType.includes("application/json")) {
            const statusData = await statusResponse.json();
            if (statusData && statusData.ok && statusData.data) {
              const connectionsList = statusData.data.connections || [];
              const connectedServiceNames = new Set(
                connectionsList
                  .filter((conn: any) => conn.connected)
                  .map((conn: any) => conn.service_name?.toLowerCase())
              );
              
              setIntegrations(prev => prev.map(integration => {
                const isConnected = connectedServiceNames.has(integration.name.toLowerCase()) ||
                  connectedServiceNames.has(integration.id.toLowerCase());
                return { ...integration, connected: isConnected };
              }));
            }
          }
        } else {
          synthToast.error("Disconnect Failed", data?.error || "Failed to disconnect.");
        }
      } else {
        try {
          const errorData = await deleteResponse.json();
          synthToast.error("Disconnect Failed", errorData?.error || "Failed to disconnect.");
        } catch {
          synthToast.error("Disconnect Failed", `Server returned ${deleteResponse.status}. Please try again.`);
        }
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      synthToast.error("Disconnect Error", "An error occurred while disconnecting.");
    }
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalCount = integrations.length;
  
  // Calculate available count using the locked function
  const availableCount = useMemo(() => {
    return integrations.filter(i => !isIntegrationLocked(i)).length;
  }, [integrations, isIntegrationLocked]);

  // Determine which UI to show based on subscription status
  // Free plan users see the subscribed UI (functional layout) but everything is locked
  const isUnsubscribed = subscriptionStatus === "UNSUBSCRIBED";
  const isFreePlan = plan === "free";
  

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Subscription Banner - Only show for unsubscribed */}
        {isUnsubscribed && (
          <SubscriptionBanner 
            feature="connect integrations and unlock automation capabilities"
          />
        )}

        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Plug className="w-6 h-6 text-primary" />
            </div>
            Connections
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Connect the apps Synth can use inside your automations.
          </motion.p>
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
              placeholder="Search by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Filter Pills & Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          {/* Filter buttons - Only show for unsubscribed users */}
          {isUnsubscribed && (
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary))]"
                      : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50 hover:border-border"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {isUnsubscribed ? (
              <>
                <Lock className="w-4 h-4 mr-1 text-muted-foreground" />
                <span className="text-foreground font-semibold">{totalCount}</span>
                <span>integrations locked</span>
              </>
            ) : isFreePlan ? (
              <>
                <Lock className="w-4 h-4 mr-1 text-muted-foreground" />
                <span className="text-foreground font-semibold">{totalCount}</span>
                <span>integrations (view only)</span>
              </>
            ) : (
              <>
                <span className="text-foreground font-semibold">{availableCount}</span>
                <span>available</span>
                <span className="mx-2 text-border">·</span>
                <span className="text-green-400 font-semibold">{connectedCount}</span>
                <span>connected</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Integrations Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filteredIntegrations.map((integration, index) => {
            // Check if THIS SPECIFIC integration is locked based on the user's plan
            const isLocked = isIntegrationLocked(integration);
            
            if (isLocked) {
              // Integration is locked - show unsubscribed/gated version
              return (
                <ConnectionIntegrationCard
                  key={integration.id}
                  integration={integration}
                  isLocked={true}
                  upgradeMessage={getUpgradeMessage(integration.tier)}
                  onClick={() => handleIntegrationClick(integration)}
                  index={index}
                />
              );
            } else {
              // Integration is unlocked - show subscribed/functional version
              return (
                <ConnectionIntegrationCardSubscribed
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.name)}
                  onDisconnect={() => handleDisconnect(integration.name)}
                  index={index}
                />
              );
            }
          })}
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

      {/* Integration Details Drawer - Only show for unsubscribed, free plan, or locked integrations */}
      {(isUnsubscribed || isFreePlan || (selectedIntegration && isIntegrationLocked(selectedIntegration))) && (
        <IntegrationDetailsDrawer
          integration={selectedIntegration}
          isLocked={selectedIntegration ? isIntegrationLocked(selectedIntegration) : false}
          upgradeMessage={selectedIntegration ? getUpgradeMessage(selectedIntegration.tier) : ""}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </PageTransition>
  );
}
