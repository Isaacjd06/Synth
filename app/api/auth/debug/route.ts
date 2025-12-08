import { NextResponse } from "next/server";

export async function GET() {
  const diagnostics = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL,
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 12) + "...",
    },
    expectedConfig: {
      redirectUri: "http://localhost:3000/api/auth/callback/google",
      signInUrl: "http://localhost:3000/api/auth/signin/google",
      callbackUrl: "/dashboard",
    },
    instructions: {
      step1: "Go to https://console.cloud.google.com/apis/credentials",
      step2: "Click on your OAuth 2.0 Client ID",
      step3: "Add to Authorized Redirect URIs: http://localhost:3000/api/auth/callback/google",
      step4: "Save and wait 5 minutes for changes to propagate",
      step5: "Also check OAuth consent screen is configured at https://console.cloud.google.com/apis/credentials/consent",
    },
    testLinks: {
      providers: "http://localhost:3000/api/auth/providers",
      csrf: "http://localhost:3000/api/auth/csrf",
      signIn: "http://localhost:3000/api/auth/signin/google",
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
