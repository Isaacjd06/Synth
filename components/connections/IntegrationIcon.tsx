"use client";

import { 
  Mail, 
  Calendar, 
  Table2, 
  MessageSquare, 
  FileText, 
  Webhook, 
  Send, 
  Gamepad2, 
  CreditCard, 
  CheckSquare, 
  LayoutGrid, 
  Database, 
  FolderOpen, 
  Palette, 
  FileEdit, 
  FormInput, 
  Video,
  FolderArchive, 
  Users, 
  Columns, 
  Receipt, 
  CalendarClock, 
  Workflow, 
  ShoppingBag, 
  Globe,
  Briefcase,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationIconProps {
  app: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Map integration names to lucide icons and brand colors - All 40 integrations
const iconMap: Record<string, { icon: LucideIcon; bgColor: string; iconColor: string }> = {
  // STARTER PLAN (1-15)
  "Gmail": { icon: Mail, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  "Google Calendar": { icon: Calendar, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Google Sheets": { icon: Table2, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Google Drive": { icon: FolderOpen, bgColor: "bg-yellow-500/15", iconColor: "text-yellow-400" },
  "Google Forms": { icon: FormInput, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Email (SMTP)": { icon: Send, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Standard Webhooks": { icon: Webhook, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "Slack": { icon: MessageSquare, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Discord": { icon: Gamepad2, bgColor: "bg-indigo-500/15", iconColor: "text-indigo-400" },
  "Zoom": { icon: Video, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Microsoft Outlook": { icon: Mail, bgColor: "bg-blue-600/15", iconColor: "text-blue-500" },
  "Microsoft OneDrive": { icon: FolderOpen, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Microsoft To Do": { icon: CheckSquare, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Evernote": { icon: FileText, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Todoist": { icon: CheckSquare, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  
  // PRO PLAN (16-30)
  "Notion": { icon: FileText, bgColor: "bg-gray-500/15", iconColor: "text-gray-400" },
  "Airtable": { icon: Database, bgColor: "bg-teal-500/15", iconColor: "text-teal-400" },
  "Trello": { icon: LayoutGrid, bgColor: "bg-sky-500/15", iconColor: "text-sky-400" },
  "ClickUp": { icon: CheckSquare, bgColor: "bg-pink-500/15", iconColor: "text-pink-400" },
  "Monday.com": { icon: Columns, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  "Asana": { icon: CheckSquare, bgColor: "bg-fuchsia-500/15", iconColor: "text-fuchsia-400" },
  "Dropbox Paper": { icon: FileEdit, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Dropbox Core": { icon: FolderArchive, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Canva": { icon: Palette, bgColor: "bg-cyan-500/15", iconColor: "text-cyan-400" },
  "Typeform": { icon: FormInput, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "HubSpot CRM": { icon: Users, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "Salesforce Essentials": { icon: Users, bgColor: "bg-sky-500/15", iconColor: "text-sky-400" },
  "Intercom": { icon: MessageSquare, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Calendly": { icon: CalendarClock, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Webflow": { icon: Globe, bgColor: "bg-cyan-500/15", iconColor: "text-cyan-400" },
  
  // AGENCY PLAN (31-40)
  "Stripe": { icon: CreditCard, bgColor: "bg-violet-500/15", iconColor: "text-violet-400" },
  "QuickBooks": { icon: Receipt, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Xero": { icon: Receipt, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Shopify": { icon: ShoppingBag, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "WooCommerce": { icon: ShoppingBag, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Custom HTTP Integrations": { icon: Webhook, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "HighLevel": { icon: Users, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Make.com Connector": { icon: Workflow, bgColor: "bg-violet-500/15", iconColor: "text-violet-400" },
  "LinkedIn Lead Gen": { icon: Users, bgColor: "bg-blue-600/15", iconColor: "text-blue-500" },
  "Meta (Facebook/Instagram) Lead Ads": { icon: Users, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
};

const sizeClasses = {
  sm: "w-8 h-8 text-lg",
  md: "w-12 h-12 text-2xl",
  lg: "w-16 h-16 text-3xl",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const IntegrationIcon = ({ app, className, size = "md" }: IntegrationIconProps) => {
  const iconConfig = iconMap[app];
  
  if (iconConfig) {
    const Icon = iconConfig.icon;
    return (
      <div 
        className={cn(
          "rounded-xl flex items-center justify-center border border-border/50",
          sizeClasses[size],
          iconConfig.bgColor,
          className
        )}
      >
        <Icon className={cn(iconSizeClasses[size], iconConfig.iconColor)} />
      </div>
    );
  }

  // Fallback: Show first letter of app name in a styled circle
  const firstLetter = app.charAt(0).toUpperCase();
  return (
    <div 
      className={cn(
        "rounded-xl flex items-center justify-center border border-border/50",
        "bg-muted/50 text-muted-foreground font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {firstLetter}
    </div>
  );
};

export default IntegrationIcon;

