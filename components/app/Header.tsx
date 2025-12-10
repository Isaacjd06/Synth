"use client";
import { Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { SubscriptionPill } from "@/app/(dashboard)/_components/subscription";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Header = () => {
  const router = useRouter();
  const { plan, isSubscribed } = useSubscription();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/";
      } else {
        // Fallback: redirect anyway
        window.location.href = "/";
      }
    } catch (error) {
      // Fallback: redirect anyway
      window.location.href = "/";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-b border-border/60 z-10">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="h-full flex items-center justify-between px-4 lg:px-6 relative">
        <Link href="/app/dashboard" className="group flex items-center gap-2.5 transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shadow-[0_0_20px_-5px_hsl(217_100%_60%/0.4)] group-hover:shadow-[0_0_30px_-5px_hsl(217_100%_60%/0.5)] transition-all duration-300 group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(217_100%_60%/0.5)]" />
          </div>
          <span className="font-accent text-xl font-semibold text-gradient-header">
            Synth
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <SubscriptionPill plan={plan} isSubscribed={isSubscribed} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground group"
          >
            <LogOut className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;



