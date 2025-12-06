import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import SubscriptionInactiveBanner from "@/components/subscription/SubscriptionInactiveBanner";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <SubscriptionGate>
        <SubscriptionInactiveBanner />
        <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
        <p className="text-gray-400">
          Welcome to your dashboard. This is a placeholder for future content.
        </p>
      </SubscriptionGate>
    </div>
  );
}

