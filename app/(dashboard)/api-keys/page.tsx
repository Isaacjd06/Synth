"use client";

import { useState } from "react";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import AppCard from "@/components/app/AppCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used: string | null;
  status: "active" | "revoked";
}

const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    prefix: "sk_live_7x9k2m",
    created_at: "2025-01-10T10:00:00Z",
    last_used: "2025-01-15T14:30:00Z",
    status: "active",
  },
  {
    id: "2",
    name: "Development Key",
    prefix: "sk_test_3n8p1q",
    created_at: "2025-01-05T09:00:00Z",
    last_used: "2025-01-12T11:00:00Z",
    status: "active",
  },
  {
    id: "3",
    name: "Old Integration",
    prefix: "sk_live_2b4c6d",
    created_at: "2024-12-01T12:00:00Z",
    last_used: null,
    status: "revoked",
  },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [isNewKeyOpen, setIsNewKeyOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const generateRandomKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "sk_live_";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const fullKey = generateRandomKey();
    const newApiKey: ApiKey = {
      id: crypto.randomUUID(),
      name: keyName.trim() || "Unnamed Key",
      prefix: fullKey.slice(0, 14),
      created_at: new Date().toISOString(),
      last_used: null,
      status: "active",
    };

    setApiKeys([newApiKey, ...apiKeys]);
    setNewKeyValue(fullKey);
    setIsCreateOpen(false);
    setIsNewKeyOpen(true);
    setKeyName("");
    setIsLoading(false);
  };

  const handleRevoke = async () => {
    if (!selectedKey) return;

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));

    setApiKeys(apiKeys.map(k =>
      k.id === selectedKey.id ? { ...k, status: "revoked" as const } : k
    ));
    setIsRevokeOpen(false);
    setSelectedKey(null);
    setIsLoading(false);
    toast.success("API key revoked successfully");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setKeyCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleCloseNewKey = () => {
    setIsNewKeyOpen(false);
    setNewKeyValue("");
    setShowNewKey(false);
    setKeyCopied(false);
  };

  return (
    <AppShell>
      <div className="px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            API Keys
          </h1>
          <p className="text-sm text-muted-foreground">Manage API keys for programmatic access to Synth.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Security Notice */}
      <AppCard className="mb-6 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Keep your API keys secure</h3>
            <p className="text-xs text-muted-foreground">
              API keys provide full access to your Synth account. Never share them publicly or commit them to version control.
              If you suspect a key has been compromised, revoke it immediately.
            </p>
          </div>
        </div>
      </AppCard>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <AppCard>
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No API Keys</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first API key to start integrating with Synth programmatically.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First API Key
            </Button>
          </div>
        </AppCard>
      ) : (
        <AppCard>
          <div className="divide-y divide-border">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Key</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Last Used</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Rows */}
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="px-4 py-4 hover:bg-muted/30 transition-colors">
                <div className="sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center space-y-2 sm:space-y-0">
                  {/* Name & Status */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{apiKey.name}</span>
                    <Badge 
                      variant={apiKey.status === "active" ? "default" : "secondary"}
                      className={apiKey.status === "active" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-muted text-muted-foreground"}
                    >
                      {apiKey.status}
                    </Badge>
                  </div>

                  {/* Key Prefix */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {apiKey.prefix}...
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(apiKey.prefix)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">{formatDate(apiKey.created_at)}</span>
                  </div>

                  {/* Last Used */}
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">
                      {apiKey.last_used ? formatDate(apiKey.last_used) : "Never"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    {apiKey.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedKey(apiKey); setIsRevokeOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key to access Synth programmatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name (optional)</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give your key a descriptive name to identify it later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setKeyName(""); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={isNewKeyOpen} onOpenChange={(open) => !open && handleCloseNewKey()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              API Key Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Store this key securely</h4>
                  <p className="text-xs text-muted-foreground">
                    This is the only time you will see this key. Copy it now and store it in a secure location.
                    You won't be able to view it again.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showNewKey ? "text" : "password"}
                    value={newKeyValue}
                    readOnly
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowNewKey(!showNewKey)}
                  >
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newKeyValue)}
                  className={keyCopied ? "border-green-500 text-green-400" : ""}
                >
                  {keyCopied ? (
                    <><CheckCircle className="w-4 h-4 mr-2" />Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copy</>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseNewKey}>
              I've Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{selectedKey?.name}"? This action cannot be undone.
              Any applications using this key will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevoke} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking...</> : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppShell>
  );
}

