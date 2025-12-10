/**
 * Utility functions for securely storing onboarding data in signed cookies
 * 
 * This module handles temporary storage of onboarding form answers
 * before user authentication is complete.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "synth_onboarding_data";
const COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds

/**
 * Signs data using HMAC-SHA256 with AUTH_SECRET
 */
function sign(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for signing onboarding cookies");
  }
  
  const hmac = createHmac("sha256", secret);
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

/**
 * Verifies and unsigns data
 */
function unsign(signedValue: string): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for verifying onboarding cookies");
  }
  
  const index = signedValue.lastIndexOf(".");
  if (index === -1) {
    return null;
  }
  
  const value = signedValue.slice(0, index);
  const signature = signedValue.slice(index + 1);
  
  const expectedSignature = createHmac("sha256", secret)
    .update(value)
    .digest("hex");
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    if (signature.length !== expectedSignature.length) {
      return null;
    }
    
    if (timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return value;
    }
    
    return null;
  } catch {
    return null;
  }
}

export interface OnboardingData {
  business_type?: string;
  automation_goal?: string;
  client_count?: string;
}

/**
 * Stores onboarding data in a signed, HTTP-only cookie
 */
export async function saveOnboardingCookie(data: OnboardingData): Promise<void> {
  const cookieStore = await cookies();
  const jsonData = JSON.stringify(data);
  const signedValue = sign(jsonData);
  
  // Determine if we should use secure cookies
  const isSecure = process.env.NODE_ENV === "production";
  
  cookieStore.set(COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Retrieves and verifies onboarding data from cookie
 */
export async function getOnboardingCookie(): Promise<OnboardingData | null> {
  const cookieStore = await cookies();
  const signedValue = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!signedValue) {
    return null;
  }
  
  const unsignedValue = unsign(signedValue);
  if (!unsignedValue) {
    // Invalid signature, cookie may have been tampered with
    return null;
  }
  
  try {
    return JSON.parse(unsignedValue) as OnboardingData;
  } catch {
    // Invalid JSON
    return null;
  }
}

/**
 * Deletes the onboarding cookie
 */
export async function deleteOnboardingCookie(): Promise<void> {
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === "production";
  
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });
}

