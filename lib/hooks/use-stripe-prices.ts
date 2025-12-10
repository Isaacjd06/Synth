import { useState, useEffect } from "react";

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  popular?: boolean;
  features: string[];
}

export interface StripeAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
}

interface StripePricesData {
  plans: StripePlan[];
  addons: StripeAddon[];
}

interface UseStripePricesReturn {
  plans: StripePlan[];
  addons: StripeAddon[];
  loading: boolean;
  error: string | null;
}

// Fetch prices from API
const fetchStripePrices = async (): Promise<StripePricesData> => {
  try {
    const response = await fetch("/api/billing/prices");
    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }
    const data = await response.json();
    
    // Transform API response to match expected format
    const plans: StripePlan[] = [
      {
        id: "starter",
        name: "Starter",
        description: "Perfect for individuals getting started",
        monthlyPrice: (data.monthly?.starter?.amount || 4900) / 100,
        yearlyPrice: (data.yearly?.starter?.amount || 47000) / 100,
        monthlyPriceId: data.monthly?.starter?.price_id || "",
        yearlyPriceId: data.yearly?.starter?.price_id || "",
        features: [
          "3 active workflows",
          "5,000 runs/month",
          "Email support",
          "Basic integrations",
          "7-day execution history",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        description: "For professionals and growing teams",
        monthlyPrice: (data.monthly?.pro?.amount || 14900) / 100,
        yearlyPrice: (data.yearly?.pro?.amount || 143000) / 100,
        monthlyPriceId: data.monthly?.pro?.price_id || "",
        yearlyPriceId: data.yearly?.pro?.price_id || "",
        popular: true,
        features: [
          "10 active workflows",
          "25,000 runs/month",
          "Priority email support",
          "Advanced integrations",
          "30-day execution history",
          "Custom webhooks",
          "Team collaboration",
        ],
      },
      {
        id: "agency",
        name: "Agency",
        description: "For agencies and large teams",
        monthlyPrice: (data.monthly?.agency?.amount || 39900) / 100,
        yearlyPrice: (data.yearly?.agency?.amount || 383000) / 100,
        monthlyPriceId: data.monthly?.agency?.price_id || "",
        yearlyPriceId: data.yearly?.agency?.price_id || "",
        features: [
          "40 active workflows",
          "100,000 runs/month",
          "Dedicated support",
          "All integrations",
          "90-day execution history",
          "Custom webhooks",
          "Team collaboration",
          "SSO & advanced security",
          "Custom onboarding",
        ],
      },
    ];

    // Add-ons would come from a separate API call or be hardcoded for MVP
    const addons: StripeAddon[] = [
      {
        id: "rapid_booster",
        name: "Rapid Automation Booster Pack",
        description: "Unlock 25,000 additional automation runs instantly.",
        price: 49,
        priceId: "price_rapid_booster",
      },
      {
        id: "performance_turbo",
        name: "Workflow Performance Turbo",
        description: "Priority workflow execution queue for significantly faster processing.",
        price: 147,
        priceId: "price_performance_turbo",
      },
      {
        id: "jumpstart",
        name: "Business Systems Jumpstart Kit",
        description: "Done-for-you workflow setup + optimization to build your foundational systems.",
        price: 199,
        priceId: "price_jumpstart",
      },
      {
        id: "ai_training",
        name: "AI Persona Training Upgrade",
        description: "Custom AI fine-tuning for the user's business context to improve instruction-following.",
        price: 249,
        priceId: "price_ai_training",
      },
      {
        id: "knowledge_injection",
        name: "Unlimited Knowledge Injection",
        description: "Unlimited document uploads + unlimited knowledge-base entries.",
        price: 99,
        priceId: "price_knowledge_injection",
      },
    ];

    return { plans, addons };
  } catch (error) {
    console.error("Error fetching Stripe prices:", error);
    // Return fallback prices if API fails
    return {
      plans: [
        {
          id: "starter",
          name: "Starter",
          description: "Perfect for individuals getting started",
          monthlyPrice: 49,
          yearlyPrice: 470,
          monthlyPriceId: "",
          yearlyPriceId: "",
          features: [
            "3 active workflows",
            "5,000 runs/month",
            "Email support",
            "Basic integrations",
            "7-day execution history",
          ],
        },
        {
          id: "pro",
          name: "Pro",
          description: "For professionals and growing teams",
          monthlyPrice: 149,
          yearlyPrice: 1430,
          monthlyPriceId: "",
          yearlyPriceId: "",
          popular: true,
          features: [
            "10 active workflows",
            "25,000 runs/month",
            "Priority email support",
            "Advanced integrations",
            "30-day execution history",
            "Custom webhooks",
            "Team collaboration",
          ],
        },
        {
          id: "agency",
          name: "Agency",
          description: "For agencies and large teams",
          monthlyPrice: 399,
          yearlyPrice: 3830,
          monthlyPriceId: "",
          yearlyPriceId: "",
          features: [
            "40 active workflows",
            "100,000 runs/month",
            "Dedicated support",
            "All integrations",
            "90-day execution history",
            "Custom webhooks",
            "Team collaboration",
            "SSO & advanced security",
            "Custom onboarding",
          ],
        },
      ],
      addons: [
        {
          id: "rapid_booster",
          name: "Rapid Automation Booster Pack",
          description: "Unlock 25,000 additional automation runs instantly.",
          price: 49,
          priceId: "price_rapid_booster",
        },
        {
          id: "performance_turbo",
          name: "Workflow Performance Turbo",
          description: "Priority workflow execution queue for significantly faster processing.",
          price: 147,
          priceId: "price_performance_turbo",
        },
        {
          id: "jumpstart",
          name: "Business Systems Jumpstart Kit",
          description: "Done-for-you workflow setup + optimization to build your foundational systems.",
          price: 199,
          priceId: "price_jumpstart",
        },
        {
          id: "ai_training",
          name: "AI Persona Training Upgrade",
          description: "Custom AI fine-tuning for the user's business context to improve instruction-following.",
          price: 249,
          priceId: "price_ai_training",
        },
        {
          id: "knowledge_injection",
          name: "Unlimited Knowledge Injection",
          description: "Unlimited document uploads + unlimited knowledge-base entries.",
          price: 99,
          priceId: "price_knowledge_injection",
        },
      ],
    };
  }
};

export const useStripePrices = (): UseStripePricesReturn => {
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [addons, setAddons] = useState<StripeAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStripePrices();
        setPlans(data.plans);
        setAddons(data.addons);
      } catch (err) {
        setError("Failed to load pricing information");
        console.error("Error fetching Stripe prices:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, []);

  return { plans, addons, loading, error };
};

