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
  Instagram, 
  Youtube, 
  FolderArchive, 
  Users, 
  Columns, 
  Receipt, 
  Twitter, 
  Bot, 
  CalendarClock, 
  Workflow, 
  ThumbsUp, 
  Megaphone, 
  Target, 
  Cloud, 
  Zap, 
  ShoppingBag, 
  HardDrive, 
  Globe, 
  Briefcase, 
  TargetIcon, 
  Wrench, 
  Server,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationIconProps {
  app: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Map integration names to lucide icons and brand colors
const iconMap: Record<string, { icon: LucideIcon; bgColor: string; iconColor: string }> = {
  // Starter tier
  "Gmail": { icon: Mail, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  "Google Calendar": { icon: Calendar, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Google Sheets": { icon: Table2, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Slack": { icon: MessageSquare, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Notion": { icon: FileText, bgColor: "bg-gray-500/15", iconColor: "text-gray-400" },
  "Webhooks": { icon: Webhook, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "Email (SMTP)": { icon: Send, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Discord": { icon: Gamepad2, bgColor: "bg-indigo-500/15", iconColor: "text-indigo-400" },
  "Stripe": { icon: CreditCard, bgColor: "bg-violet-500/15", iconColor: "text-violet-400" },
  "ClickUp": { icon: CheckSquare, bgColor: "bg-pink-500/15", iconColor: "text-pink-400" },
  "Trello": { icon: LayoutGrid, bgColor: "bg-sky-500/15", iconColor: "text-sky-400" },
  "Airtable": { icon: Database, bgColor: "bg-teal-500/15", iconColor: "text-teal-400" },
  "Google Drive": { icon: FolderOpen, bgColor: "bg-yellow-500/15", iconColor: "text-yellow-400" },
  "Canva": { icon: Palette, bgColor: "bg-cyan-500/15", iconColor: "text-cyan-400" },
  "Dropbox Paper": { icon: FileEdit, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Google Forms": { icon: FormInput, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Instagram Basic API": { icon: Instagram, bgColor: "bg-pink-500/15", iconColor: "text-pink-400" },
  "YouTube API": { icon: Youtube, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  
  // Pro tier
  "Dropbox": { icon: FolderArchive, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "HubSpot CRM": { icon: Users, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "Monday.com": { icon: Columns, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  "QuickBooks": { icon: Receipt, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Twitter (X)": { icon: Twitter, bgColor: "bg-gray-500/15", iconColor: "text-gray-400" },
  "OpenAI API": { icon: Bot, bgColor: "bg-emerald-500/15", iconColor: "text-emerald-400" },
  "Calendly": { icon: CalendarClock, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Make.com Bridge": { icon: Workflow, bgColor: "bg-violet-500/15", iconColor: "text-violet-400" },
  "Facebook Pages API": { icon: ThumbsUp, bgColor: "bg-blue-600/15", iconColor: "text-blue-500" },
  "Google Ads": { icon: Megaphone, bgColor: "bg-yellow-500/15", iconColor: "text-yellow-400" },
  "Meta Ads Manager": { icon: Target, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  
  // Agency tier
  "Salesforce": { icon: Cloud, bgColor: "bg-sky-500/15", iconColor: "text-sky-400" },
  "Zoho CRM": { icon: Users, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
  "Zapier Handoff": { icon: Zap, bgColor: "bg-orange-500/15", iconColor: "text-orange-400" },
  "Shopify Admin API": { icon: ShoppingBag, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "AWS S3": { icon: HardDrive, bgColor: "bg-amber-500/15", iconColor: "text-amber-400" },
  "Azure Blob Storage": { icon: Server, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Google Cloud Storage": { icon: Globe, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "Microsoft Teams": { icon: Briefcase, bgColor: "bg-purple-500/15", iconColor: "text-purple-400" },
  "Jira": { icon: TargetIcon, bgColor: "bg-blue-500/15", iconColor: "text-blue-400" },
  "ServiceNow": { icon: Wrench, bgColor: "bg-green-500/15", iconColor: "text-green-400" },
  "Oracle Cloud Storage": { icon: Server, bgColor: "bg-red-500/15", iconColor: "text-red-400" },
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

