import { Copy, Trash2, Calendar, Clock, Shield, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ApiKeyStatusBadge from "./ApiKeyStatusBadge";
import ApiKeyScopeBadge from "./ApiKeyScopeBadge";
import type { ApiKeyData } from "./ApiKeyCard";

interface ApiKeyDetailsModalProps {
  apiKey: ApiKeyData | null;
  open: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onRevoke: (id: string) => void;
}

const ApiKeyDetailsModal = ({
  apiKey,
  open,
  onClose,
  onCopy,
  onRevoke,
}: ApiKeyDetailsModalProps) => {
  if (!apiKey) return null;

  const curlExample = `curl -X GET "https://api.synth.io/v1/workflows" \\
  -H "Authorization: Bearer ${apiKey.maskedKey}"`;

  const jsExample = `const response = await fetch('https://api.synth.io/v1/workflows', {
  headers: {
    'Authorization': 'Bearer ${apiKey.maskedKey}'
  }
});
const data = await response.json();`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="mb-2">{apiKey.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <ApiKeyStatusBadge status={apiKey.status} />
                <ApiKeyScopeBadge scope={apiKey.scope} />
              </div>
            </div>
            {apiKey.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onRevoke(apiKey.id);
                  onClose();
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Revoke Key
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Key Information</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Key</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {apiKey.maskedKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onCopy(apiKey.maskedKey)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Key ID
                </span>
                <code className="text-xs font-mono text-muted-foreground">
                  key_{apiKey.id}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created
                </span>
                <span className="text-sm text-foreground">{apiKey.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last Used
                </span>
                <span className="text-sm text-foreground">{apiKey.lastUsed || "Never"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Scope
                </span>
                <ApiKeyScopeBadge scope={apiKey.scope} />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Usage Examples */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Usage Examples</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">cURL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onCopy(curlExample)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
                  {curlExample}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">JavaScript</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onCopy(jsExample)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
                  {jsExample}
                </pre>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Security Notice */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Security Notice</h4>
                <p className="text-xs text-muted-foreground">
                  Keep this key secret. Do not share it publicly or expose it in client-side code.
                  If you believe this key has been compromised, revoke it immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDetailsModal;



