import SubscriptionInactiveBanner from "@/components/subscription/SubscriptionInactiveBanner";
import SynthUpdatesCard from "@/components/dashboard/SynthUpdatesCard";
import SynthAdvisory from "@/components/dashboard/SynthAdvisory";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <SubscriptionInactiveBanner />
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Monitor your automations and get intelligent recommendations
        </p>
      </div>

      {/* Synth Updates - "What happened?" - Factual, operational summary */}
      <div className="mt-6">
        <SynthUpdatesCard />
      </div>

      {/* Synth Advisory - "What does it mean, and what should I do?" - AI-powered insights */}
      <div className="mt-6">
        <SynthAdvisory />
      </div>
    </div>
  );
}

