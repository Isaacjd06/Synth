import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";
import { success, error } from "@/lib/api-response";
import { PipedreamError } from "@/lib/pipedream";

const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || "https://api.pipedream.com/v1";

/**
 * DELETE /api/connections/[service]
 * 
 * Disconnects a service by:
 * 1. Looking up connection row
 * 2. Calling Pipedream API to revoke token
 * 3. Deleting row from Neon
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Get service name from params
    const { service: serviceName } = await params;

    if (!serviceName) {
      return error("Service name is required", { status: 400 });
    }

    // 3. Look up connection row
    const connection = await prisma.connection.findFirst({
      where: {
        user_id: userId,
        service_name: serviceName,
      },
    });

    if (!connection) {
      return error("Connection not found", { status: 404 });
    }

    // 4. Call Pipedream API to revoke token (if we have auth_id)
    if (connection.pipedream_auth_id && PIPEDREAM_API_KEY) {
      try {
        // Revoke OAuth connection in Pipedream
        const revokeEndpoints = [
          `/oauth/revoke`,
          `/v1/oauth/revoke`,
          `/sources/${serviceName.toLowerCase()}/oauth/revoke`,
          `/v1/sources/${serviceName.toLowerCase()}/oauth/revoke`,
          `/components/${serviceName.toLowerCase()}/oauth/revoke`,
          `/v1/components/${serviceName.toLowerCase()}/oauth/revoke`,
        ];

        let revoked = false;
        for (const endpoint of revokeEndpoints) {
          try {
            const response = await fetch(`${PIPEDREAM_API_URL}${endpoint}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                auth_id: connection.pipedream_auth_id,
                service: serviceName,
              }),
            });

            if (response.ok) {
              revoked = true;
              break;
            }
          } catch {
            // Continue to next endpoint
            continue;
          }
        }

        if (!revoked) {
          // Log warning but continue - connection will still be deleted from our DB
          logError("app/api/connections/[service] (revoke token failed)", new Error(`Failed to revoke connection for ${serviceName}`));
        }
      } catch (err) {
        // Log error but continue - connection will still be deleted from our DB
        logError("app/api/connections/[service] (revoke token)", err);
      }
    }

    // 5. Delete row from Neon
    await prisma.connection.delete({
      where: { id: connection.id },
    });

    // 6. Log audit event
    await logAudit("connection.delete", userId, {
      connection_id: connection.id,
      service_name: serviceName,
    });

    // 7. Return success
    return success({
      message: "Connection disconnected successfully",
      service: serviceName,
    });
  } catch (err) {
    logError("app/api/connections/[service]", err);
    return error(
      "Failed to disconnect. Please try again or contact support if the issue persists.",
      { status: 500 }
    );
  }
}

