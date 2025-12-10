/**
 * POST /api/onboarding/commit
 * 
 * Commits temporary onboarding data to the user's memory table.
 * This route REQUIRES authentication.
 * 
 * After Google sign-in completes, the frontend will call this route
 * to persist the onboarding answers into the memory table.
 */

import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getOnboardingCookie, deleteOnboardingCookie } from "@/lib/onboarding-cookies";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/error-logger";

export async function POST(req: Request) {
  try {
    // Require authentication
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 if unauthorized
    }
    
    const { userId } = authResult;
    
    // Retrieve temporary onboarding data from cookie
    const onboardingData = await getOnboardingCookie();
    
    if (!onboardingData || Object.keys(onboardingData).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "No onboarding data found. The data may have expired or was already processed.",
          imported: false
        },
        { status: 404 }
      );
    }
    
    // Insert each onboarding answer into the memory table
    const memoryEntries = [];
    
    if (onboardingData.business_type) {
      const memory = await prisma.memory.create({
        data: {
          user_id: userId,
          context_type: "business_type",
          content: { value: onboardingData.business_type } as Prisma.InputJsonValue,
          last_accessed: new Date(),
        },
      });
      memoryEntries.push(memory);
    }
    
    if (onboardingData.automation_goal) {
      const memory = await prisma.memory.create({
        data: {
          user_id: userId,
          context_type: "automation_goal",
          content: { value: onboardingData.automation_goal } as Prisma.InputJsonValue,
          last_accessed: new Date(),
        },
      });
      memoryEntries.push(memory);
    }
    
    if (onboardingData.client_count) {
      const memory = await prisma.memory.create({
        data: {
          user_id: userId,
          context_type: "client_count",
          content: { value: onboardingData.client_count } as Prisma.InputJsonValue,
          last_accessed: new Date(),
        },
      });
      memoryEntries.push(memory);
    }
    
    // Delete the temporary cookie after successful commit
    await deleteOnboardingCookie();
    
    return NextResponse.json(
      { 
        success: true,
        imported: true,
        entries_created: memoryEntries.length
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/onboarding/commit", error);
    
    // Attempt to clean up cookie even on error
    try {
      await deleteOnboardingCookie();
    } catch (cleanupError) {
      console.error("Failed to cleanup onboarding cookie:", cleanupError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to commit onboarding data",
        details: error instanceof Error ? error.message : "Unknown error",
        imported: false
      },
      { status: 500 }
    );
  }
}

