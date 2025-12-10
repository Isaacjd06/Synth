/**
 * POST /api/onboarding/save-temp
 * 
 * Temporarily stores onboarding form answers before user authentication.
 * This route does NOT require authentication.
 * 
 * The data is stored in a signed, HTTP-only cookie that expires in 15 minutes.
 */

import { NextResponse } from "next/server";
import { saveOnboardingCookie, type OnboardingData } from "@/lib/onboarding-cookies";

interface SaveTempRequestBody {
  business_type?: string;
  automation_goal?: string;
  client_count?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveTempRequestBody;
    
    // Validate that at least one field is provided
    const hasData = body.business_type || body.automation_goal || body.client_count;
    if (!hasData) {
      return NextResponse.json(
        { error: "At least one onboarding field must be provided" },
        { status: 400 }
      );
    }
    
    // Validate field values (basic validation)
    const onboardingData: OnboardingData = {};
    
    if (body.business_type !== undefined) {
      if (typeof body.business_type !== "string" || body.business_type.trim().length === 0) {
        return NextResponse.json(
          { error: "business_type must be a non-empty string" },
          { status: 400 }
        );
      }
      onboardingData.business_type = body.business_type.trim();
    }
    
    if (body.automation_goal !== undefined) {
      if (typeof body.automation_goal !== "string" || body.automation_goal.trim().length === 0) {
        return NextResponse.json(
          { error: "automation_goal must be a non-empty string" },
          { status: 400 }
        );
      }
      onboardingData.automation_goal = body.automation_goal.trim();
    }
    
    if (body.client_count !== undefined) {
      if (typeof body.client_count !== "string" || body.client_count.trim().length === 0) {
        return NextResponse.json(
          { error: "client_count must be a non-empty string" },
          { status: 400 }
        );
      }
      onboardingData.client_count = body.client_count.trim();
    }
    
    // Store in signed cookie
    await saveOnboardingCookie(onboardingData);
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error saving temporary onboarding data:", error);
    return NextResponse.json(
      { 
        error: "Failed to save onboarding data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

