import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
