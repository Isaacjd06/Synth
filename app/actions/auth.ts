"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function googleSignIn() {
  // In NextAuth v5, signIn returns a URL when redirect: false
  // Or throws NEXT_REDIRECT when redirecting
  // We need to handle this properly
  const result = await signIn("google", {
    redirectTo: "/dashboard",
    redirect: true, // Let NextAuth handle the redirect
  });

  // If we get here, something went wrong (signIn should redirect)
  // Fallback: manually redirect
  if (typeof result === "string") {
    redirect(result);
  }
}
