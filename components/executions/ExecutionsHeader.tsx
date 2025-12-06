"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

export default function ExecutionsHeader() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className="gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh
    </Button>
  );
}

