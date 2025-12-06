"use server";

import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logUsage } from "@/lib/usage";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";

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

    const body = await req.json();
    const { context_type, content, relevance_score, metadata } = body;

    if (!context_type || content === undefined) {
      return NextResponse.json(
        { error: "Both 'context_type' and 'content' are required." },
        { status: 400 },
      );
    }

    const memory = await prisma.memory.create({
      data: {
        user_id: userId,
        context_type,
        content,
        relevance_score: relevance_score || null,
        metadata: metadata || null,
        last_accessed: new Date(),
      },
    });

    // Log usage
    await logUsage(userId, "memory_write");

    // Log audit event
    await logAudit("memory.write", userId, {
      memory_id: memory.id,
      context_type: memory.context_type,
    });

    // Emit event
    Events.emit("memory:updated", {
      memory_id: memory.id,
      user_id: userId,
      context_type: memory.context_type,
    });

    return NextResponse.json(
      {
        ok: true,
        memory,
      },
      { status: 201 },
    );
  } catch (error: any) {
    logError("app/api/memory/create", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
