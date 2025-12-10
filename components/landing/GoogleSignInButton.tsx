"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "navbar" | "hero" | "pricing" | "cta" | "footer";
}

const GoogleSignInButton = ({ className = "", variant = "primary" }: GoogleSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      // NextAuth v5: Use server action for sign-in
      // Import the server action from app/actions/auth.ts
      const { googleSignIn } = await import("@/app/actions/auth");
      await googleSignIn();
    } catch (error) {
      console.error("Error initiating Google sign-in:", error);
      setIsLoading(false);
      // You could add a toast notification here if needed
    }
  };

  const baseStyles = "inline-flex items-center justify-center gap-2.5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const getVariantStyles = () => {
    switch (variant) {
      case "navbar":
        return "px-4 py-2 text-sm bg-white/5 border border-white/10 text-foreground/80 hover:bg-white/10 hover:text-foreground rounded-lg";
      case "hero":
        return "px-6 py-4 text-base bg-white text-gray-900 hover:bg-gray-100 rounded-xl shadow-lg hover:shadow-xl";
      case "pricing":
        return "px-6 py-3 text-sm bg-white/5 border border-white/10 text-foreground/70 hover:bg-white/10 hover:text-foreground rounded-xl";
      case "cta":
        return "px-6 py-4 text-base bg-white/10 border border-white/20 text-foreground hover:bg-white/15 rounded-xl";
      case "footer":
        return "px-4 py-2 text-sm bg-white/5 border border-white/10 text-foreground/60 hover:bg-white/10 hover:text-foreground rounded-lg";
      case "secondary":
        return "px-6 py-3 bg-card border border-border text-foreground hover:bg-muted rounded-lg";
      default:
        return "px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl rounded-lg";
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Signing in...";
    if (variant === "navbar" || variant === "footer") return "Log in with Google";
    return "Log in with Google";
  };

  return (
    <motion.button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>{getButtonText()}</span>
    </motion.button>
  );
};

export default GoogleSignInButton;



