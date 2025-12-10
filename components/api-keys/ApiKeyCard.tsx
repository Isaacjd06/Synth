"use client";
import { motion } from "framer-motion";
import { Copy, Eye, Trash2, Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiKeyStatusBadge, { ApiKeyStatus } from "./ApiKeyStatusBadge";
import ApiKeyScopeBadge, { ApiKeyScope } from "./ApiKeyScopeBadge";

export interface ApiKeyData {
  id: string;
  name: string;
  maskedKey: string;
  fullKey?: string;
  scope: ApiKeyScope;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsed: string | null;
}

interface ApiKeyCardProps {
  apiKey: ApiKeyData;
  index: number;
  onView: (key: ApiKeyData) => void;
  onCopy: (key: string) => void;
  onRevoke: (id: string) => void;
}

const ApiKeyCard = ({ apiKey, index, onView, onCopy, onRevoke }: ApiKeyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 bg-card border-border hover:border-border/80 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Name & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-foreground truncate">{apiKey.name}</h3>
              <ApiKeyStatusBadge status={apiKey.status} />
              <ApiKeyScopeBadge scope={apiKey.scope} />
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {apiKey.maskedKey}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onCopy(apiKey.maskedKey)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {apiKey.createdAt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Last used: {apiKey.lastUsed || "Never"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onView(apiKey)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              View
            </Button>
            {apiKey.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRevoke(apiKey.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Revoke
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ApiKeyCard;




