import { useState } from "react";
import { Loader2, AlertTriangle, Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { ApiKeyScope } from "./ApiKeyScopeBadge";

interface NewApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, scope: ApiKeyScope, notes: string) => string;
}

const NewApiKeyModal = ({ open, onClose, onCreate }: NewApiKeyModalProps) => {
  const [step, setStep] = useState<"create" | "display">("create");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("full");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Custom scope checkboxes
  const [customScopes, setCustomScopes] = useState({
    workflows: true,
    executions: true,
    connections: false,
    knowledge: false,
  });

  const handleCreate = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const generatedKey = onCreate(name.trim() || "Unnamed Key", scope, notes.trim());
    setNewKey(generatedKey);
    setStep("display");
    setIsLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("create");
    setName("");
    setScope("full");
    setNotes("");
    setNewKey("");
    setShowKey(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === "create" ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access Synth programmatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as ApiKeyScope)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scope === "custom" && (
                <div className="space-y-3 pl-1">
                  <Label className="text-xs text-muted-foreground">Permissions</Label>
                  <div className="space-y-2">
                    {Object.entries(customScopes).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setCustomScopes({ ...customScopes, [key]: checked })
                          }
                        />
                        <Label htmlFor={key} className="text-sm font-normal capitalize">
                          {key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="key-notes">Notes (optional)</Label>
                <Textarea
                  id="key-notes"
                  placeholder="Add any notes about this key's purpose..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background border-border min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      Copy your new API key now
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      This is the only time you will see this key. Store it in a secure location.
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
                      type={showKey ? "text" : "password"}
                      value={newKey}
                      readOnly
                      className="font-mono text-sm pr-10 bg-background border-border"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className={copied ? "border-green-500 text-green-400" : ""}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>I've Saved My Key</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewApiKeyModal;



