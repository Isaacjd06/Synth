"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Badge from "@/components/ui/Badge";
import { LogOut, CreditCard, LayoutDashboard } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";

export default function Header() {
  const { user, isActive, isTrialValid, isLoading } = useSubscription();
  const router = useRouter();

  const hasValidSubscription = isActive || isTrialValid;

  const handleSignIn = () => {
    router.push("/api/auth/signin?provider=google");
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleManageBilling = () => {
    router.push("/billing");
  };
  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || "U";

  const avatarUrl = user?.avatar_url || user?.image;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 z-50">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-100">
              Synth
            </h1>
          </Link>
          <div className="ml-3 sm:ml-4 h-6 w-px bg-gray-700 hidden sm:block" />
          <div className="ml-3 sm:ml-4 h-4 w-1 bg-[#194c92] hidden sm:block" />
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-800 animate-pulse" />
          ) : !user ? (
            /* Not logged in - Show "Continue with Google" button */
            <Button onClick={handleSignIn} size="sm">
              Continue with Google
            </Button>
          ) : (
            <>
              {/* Logged in - Show subscription status and user menu */}
              {!hasValidSubscription && (
                <Link href="/billing">
                  <Button size="sm" variant="default">
                    Upgrade
                  </Button>
                </Link>
              )}

              {hasValidSubscription && (
                <Badge variant="success" className="hidden sm:inline-flex">
                  Pro
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#194c92] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} alt={user.name || "User"} />
                      <AvatarFallback className="bg-[#194c92] text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                    {hasValidSubscription && (
                      <div className="mt-1">
                        <Badge variant="success" className="text-xs">
                          Pro
                        </Badge>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleManageBilling}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
