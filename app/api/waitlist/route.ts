import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const WaitlistRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  source: z.string().optional().default("landing_page"),
});

/**
 * POST /api/waitlist
 *
 * Adds an email to the waitlist.
 *
 * Requirements:
 * - Request body must contain { email: string }
 * - Email must be valid format
 *
 * Returns:
 * - { success: true } if email is added or already exists (no sensitive info revealed)
 * - { success: false, error: string } if email is invalid or other error occurs
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validationResult = WaitlistRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        },
        { status: 400 }
      );
    }

    const { email, name, source } = validationResult.data;

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      // Update status if it was "converted" (in case they want to rejoin)
      // Otherwise, don't reveal that email already exists - return success
      if (existing.status === "converted") {
        await prisma.waitlist.update({
          where: { email },
          data: {
            status: "waiting",
            name: name || existing.name,
            source: source || existing.source,
          },
        });
      }
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Insert new waitlist record
    await prisma.waitlist.create({
      data: {
        email,
        name: name || null,
        source: source || "landing_page",
        status: "waiting",
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("WAITLIST API ERROR:", error);

    // Handle Prisma unique constraint violation (shouldn't happen due to check above, but just in case)
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      // Email already exists - return success without revealing
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}

