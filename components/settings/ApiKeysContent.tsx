"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyCard, { ApiKeyData } from "@/components/api-keys/ApiKeyCard";
import ApiKeyDetailsModal from "@/components/api-keys/ApiKeyDetailsModal";
import NewApiKeyModal from "@/components/api-keys/NewApiKeyModal";
import RevokeKeyModal from "@/components/api-keys/RevokeKeyModal";
import ApiKeyGuidelinesCard from "@/components/api-keys/ApiKeyGuidelinesCard";
import ApiKeyEmptyState from "@/components/api-keys/ApiKeyEmptyState";
import { toast } from "sonner";
import type { ApiKeyScope } from "@/components/api-keys/ApiKeyScopeBadge";

const mockApiKeys: ApiKeyData[] = [
  {
    id: "1",
    name: "Production API Key",
    maskedKey: "sk_live_********3k9F",
    scope: "full",
    status: "active",
    createdAt: "Jan 10, 2025",
    lastUsed: "2 hours ago",
  },
  {
    id: "2",
    name: "Development Key",
    maskedKey: "sk_test_********7m2P",
    scope: "full",
    status: "active",
    createdAt: "Jan 5, 2025",
    lastUsed: "1 day ago",
  },
  {
    id: "3",
    name: "Read-Only Analytics",
    maskedKey: "sk_live_********9x4Q",
    scope: "read",
    status: "active",
    createdAt: "Dec 28, 2024",
    lastUsed: "3 days ago",
  },
  {
    id: "4",
    name: "Legacy Integration",
    maskedKey: "sk_live_********2b6W",
    scope: "custom",
    status: "revoked",
    createdAt: "Dec 1, 2024",
    lastUsed: "Never",
  },
];

const generateRandomKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "sk_live_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const ApiKeysContent = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>(mockApiKeys);
  const [selectedKey, setSelectedKey] = useState<ApiKeyData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleView = (key: ApiKeyData) => {
    setSelectedKey(key);
    setDetailsOpen(true);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCreate = (name: string, scope: ApiKeyScope, notes: string): string => {
    const fullKey = generateRandomKey();
    const newKey: ApiKeyData = {
      id: crypto.randomUUID(),
      name,
      maskedKey: fullKey.slice(0, 8) + "********" + fullKey.slice(-4),
      fullKey,
      scope,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastUsed: null,
    };
    setApiKeys([newKey, ...apiKeys]);
    toast.success("API key created successfully");
    return fullKey;
  };

  const handleRevoke = async () => {
    if (!revokeId) return;

    setIsRevoking(true);
    await new Promise((r) => setTimeout(r, 500));

    setApiKeys(
      apiKeys.map((k) =>
        k.id === revokeId ? { ...k, status: "revoked" as const } : k
      )
    );
    setRevokeId(null);
    setIsRevoking(false);
    toast.success("API key revoked successfully");
  };

  const keyToRevoke = apiKeys.find((k) => k.id === revokeId);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              API Keys
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your API keys for accessing Synth programmatically.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Generate New API Key
        </Button>
      </motion.div>

      {/* API Key List */}
      {apiKeys.length === 0 ? (
        <ApiKeyEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key, idx) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              index={idx}
              onView={handleView}
              onCopy={handleCopy}
              onRevoke={(id) => setRevokeId(id)}
            />
          ))}
        </div>
      )}

      {/* Guidelines Card */}
      <ApiKeyGuidelinesCard />

      {/* Details Modal */}
      <ApiKeyDetailsModal
        apiKey={selectedKey}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onCopy={handleCopy}
        onRevoke={(id) => {
          setDetailsOpen(false);
          setRevokeId(id);
        }}
      />

      {/* Create Modal */}
      <NewApiKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      {/* Revoke Modal */}
      <RevokeKeyModal
        keyName={keyToRevoke?.name || null}
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        onRevoke={handleRevoke}
        isLoading={isRevoking}
      />
    </div>
  );
};

export default ApiKeysContent;




