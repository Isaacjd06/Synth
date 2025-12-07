import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logUsage } from "@/lib/usage";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";

interface MemoryUpdateRequestBody {
  id: string;
  context_type?: string;
  content?: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

const memoryLimiter = createRateLimiter("memory", 15, 60);

export async function POST(req: Request) {
  try {
    // Check rate limit
    await rateLimitOrThrow(req, memoryLimiter);

    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json() as MemoryUpdateRequestBody;
    const { id, context_type, content, relevance_score, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 },
      );
    }

    // Confirm memory entry exists and belongs to the user
    const existing = await prisma.memory.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Memory entry not found." },
        { status: 404 },
      );
    }

    // Build update object dynamically
    const updateData: {
      context_type?: string;
      content?: string;
      relevance_score?: number;
      metadata?: Prisma.InputJsonValue;
      last_accessed: Date;
    } = {
      last_accessed: new Date(), // Always update last_accessed
    };
    if (context_type !== undefined) updateData.context_type = context_type;
    if (content !== undefined) updateData.content = content;
    if (relevance_score !== undefined)
      updateData.relevance_score = relevance_score;
    if (metadata !== undefined) updateData.metadata = metadata as Prisma.InputJsonValue;

    const updated = await prisma.memory.update({
      where: { id },
      data: updateData,
    });

    // Log usage
    await logUsage(userId, "memory_write");

    // Log audit event
    await logAudit("memory.write", userId, {
      memory_id: id,
      context_type: updated.context_type,
    });

    // Emit event
    Events.emit("memory:updated", {
      memory_id: id,
      user_id: userId,
      context_type: updated.context_type,
    });

    return NextResponse.json(
      {
        ok: true,
        memory: updated,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    logError("app/api/memory/update", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
