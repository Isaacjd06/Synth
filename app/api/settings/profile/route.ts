import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

/**
 * GET /api/settings/profile
 * 
 * Get user profile information.
 * Requires authentication.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        email_verified: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: user,
    });
  } catch (error: unknown) {
    logError("app/api/settings/profile (GET)", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/profile
 * 
 * Update user profile information.
 * Requires authentication.
 * 
 * Body:
 * - name: Optional new name
 * - email: Optional new email (requires re-verification)
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = UpdateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email } = validationResult.data;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            ok: false,
            error: "Email is already in use by another account",
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      email?: string;
      email_verified?: boolean;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
      // Email change requires re-verification
      updateData.email_verified = false;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        email_verified: true,
        created_at: true,
        last_login_at: true,
      },
    });

    // Log audit event
    await logAudit("profile.update", userId, {
      updated_fields: Object.keys(updateData),
    });

    return NextResponse.json({
      ok: true,
      profile: updatedUser,
      message: email
        ? "Profile updated. Please verify your new email address."
        : "Profile updated successfully.",
    });
  } catch (error: unknown) {
    logError("app/api/settings/profile (PUT)", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

