import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Allowed file types
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/knowledge/upload
 * Upload and process a knowledge file
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: `File type not allowed. Allowed types: PDF, TXT, Markdown, Word, CSV`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads", "knowledge", userId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedFilename}`;
    const filePath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const fileRecord = await prisma.knowledge_files.create({
      data: {
        user_id: userId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        status: "processing",
      },
    });

    // Process file asynchronously (in production, use a queue like Bull or similar)
    // For now, we'll mark it as processing and return immediately
    // In a real implementation, you'd extract text here or queue it for processing

    return NextResponse.json({
      ok: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        fileType: fileRecord.file_type,
        fileSize: fileRecord.file_size,
        status: fileRecord.status,
        createdAt: fileRecord.created_at,
      },
    });
  } catch (error: unknown) {
    console.error("FILE UPLOAD ERROR:", error);
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
 * GET /api/knowledge/upload
 * List uploaded files for the authenticated user
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const files = await prisma.knowledge_files.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      files: files.map((file) => ({
        id: file.id,
        filename: file.filename,
        fileType: file.file_type,
        fileSize: file.file_size,
        status: file.status,
        errorMessage: file.error_message,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
      })),
    });
  } catch (error: unknown) {
    console.error("FILE LIST ERROR:", error);
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
 * DELETE /api/knowledge/upload
 * Delete an uploaded file
 */
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    // Verify file belongs to user
    const existing = await prisma.knowledge_files.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Delete file from filesystem if it exists
    if (existing.storage_path) {
      try {
        const { unlink } = await import("fs/promises");
        await unlink(existing.storage_path);
      } catch (error) {
        // Log but don't fail if file doesn't exist
        console.warn("Failed to delete file from filesystem:", error);
      }
    }

    // Delete database record
    await prisma.knowledge_files.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "File deleted successfully",
    });
  } catch (error: unknown) {
    console.error("FILE DELETE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

