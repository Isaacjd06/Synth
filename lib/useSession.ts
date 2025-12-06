"use client";

import { useState, useEffect } from "react";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar_url?: string | null;
  subscriptionStatus?: string | null;
  plan?: string | null;
  trialEndsAt?: Date | string | null;
}

interface Session {
  user?: SessionUser;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        setIsLoading(false);
      })
      .catch(() => {
        setSession(null);
        setIsLoading(false);
      });
  }, []);

  return { data: session, status: isLoading ? "loading" : "authenticated" };
}

