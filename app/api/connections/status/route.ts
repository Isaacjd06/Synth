import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/connections/status
 * 
 * Returns all connected services for the current user.
 * Used by UI to show "Connected"/"Disconnected" status.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Fetch all connections for user
    const connections = await prisma.connection.findMany({
      where: {
        user_id: userId,
        status: "active",
      },
      select: {
        service_name: true,
        created_at: true,
        last_verified: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 3. Build response with all integrations and their connection status
    // Get all possible integrations from the plan matrix
    const { getAllowedIntegrationsForPlan } = await import("@/lib/integrations-plan");
    const { getCurrentUserWithSubscription } = await import("@/lib/subscription");
    
    const user = await getCurrentUserWithSubscription(userId);
    const isInTrial = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
    const effectivePlan = isInTrial 
      ? ("agency" as const)
      : (user.subscription_plan || "free");

    const allIntegrations = getAllowedIntegrationsForPlan(effectivePlan);
    
    // Create a map of connected services
    const connectedServices = new Set(
      connections.map((conn) => conn.service_name.toLowerCase())
    );

    // Build response with all integrations and their status
    const connectionsList = allIntegrations.map((serviceName) => {
      const connection = connections.find(
        (conn) => conn.service_name.toLowerCase() === serviceName.toLowerCase()
      );

      return {
        service_name: serviceName,
        connected: !!connection,
        created_at: connection?.created_at.toISOString() || null,
        last_verified: connection?.last_verified?.toISOString() || null,
      };
    });

    // Also include any connections that aren't in the plan list (legacy connections)
    const legacyConnections = connections
      .filter(
        (conn) =>
          !allIntegrations.some(
            (int) => int.toLowerCase() === conn.service_name.toLowerCase()
          )
      )
      .map((conn) => ({
        service_name: conn.service_name,
        connected: true,
        created_at: conn.created_at.toISOString(),
        last_verified: conn.last_verified?.toISOString() || null,
      }));

    return success({
      connections: [...connectionsList, ...legacyConnections],
    });
  } catch (err) {
    logError("app/api/connections/status", err);
    return error(
      "Failed to load connection status. Please try again.",
      { status: 500 }
    );
  }
}

