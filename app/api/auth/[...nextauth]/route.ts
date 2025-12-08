import { handlers } from "@/lib/auth";

// NextAuth API routes MUST use Node.js runtime (not Edge)
// Prisma adapter requires Node.js runtime
export const runtime = "nodejs";

export const { GET, POST } = handlers;

