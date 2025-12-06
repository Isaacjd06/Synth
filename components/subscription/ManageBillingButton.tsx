"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ManageBillingButtonProps {
  className?: string;
}

export default function ManageBillingButton({
  className,
}: ManageBillingButtonProps) {
  const router = useRouter();

  const handleManageBilling = () => {
    // Navigate to new billing management page
    router.push("/billing");
  };

  return (
    <Button
      onClick={handleManageBilling}
      variant="outline"
      size="lg"
      className={className}
    >
      Manage Billing
    </Button>
  );
}

