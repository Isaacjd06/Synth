export type IntegrationTier = "starter" | "pro" | "agency";

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: IntegrationTier;
  category: string;
  connected: boolean;
  comingSoon?: boolean;
  permissions?: string[];
  version?: string;
}

