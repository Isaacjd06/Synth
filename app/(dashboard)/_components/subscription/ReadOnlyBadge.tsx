"use client";

import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export default function ReadOnlyBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-muted/50 text-muted-foreground border-border flex items-center gap-1.5"
    >
      <Eye className="w-3 h-3" />
      Read Only
    </Badge>
  );
}

