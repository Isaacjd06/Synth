import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";

export default function KnowledgePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <SubscriptionGuard>
        <h1 className="text-3xl font-bold text-white mb-4">Knowledge Base</h1>
        <p className="text-gray-400">
          Manage your knowledge base and documents.
        </p>
      </SubscriptionGuard>
    </div>
  );
}

