import { handlers } from "@/lib/auth";

// NextAuth API routes MUST use Node.js runtime (not Edge)
// Prisma adapter requires Node.js runtime
export const runtime = "nodejs";

// Export NextAuth handlers
// Error handling is done in lib/auth.ts where we validate credentials
export const { GET, POST } = handlers;

