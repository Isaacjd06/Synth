"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface SubscribeButtonProps {
  trialDays?: number;
  className?: string;
  plan?: string; // Optional plan ID to pre-select (e.g., "pro", "starter", "agency")
}

export default function SubscribeButton({
  trialDays = 3,
  className,
  plan,
}: SubscribeButtonProps) {
  const router = useRouter();

  const handleSubscribe = () => {
    // Navigate to billing page with optional plan parameter
    const url = plan ? `/billing?plan=${plan}` : "/billing";
    router.push(url);
  };

  const buttonText = trialDays > 0 
    ? `Start ${trialDays}-Day Free Trial`
    : "Subscribe";

  return (
    <Button
      onClick={handleSubscribe}
      size="lg"
      className={className}
    >
      {buttonText}
    </Button>
  );
}

