import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateSubscriptionAddons,
  validatePlanAndAddons,
} from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";

interface AddOn {
  price_id: string;
  name: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await req.json();
    const { add_on_price_ids = [] } = body;

    // 3. Validate add-ons
    const validation = validatePlanAndAddons("", add_on_price_ids);
    if (!validation.valid && add_on_price_ids.length > 0) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 4. Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // 5. Build add-ons array
    const addOns: AddOn[] = add_on_price_ids.map((priceId: string) => ({
      price_id: priceId,
      name: priceId, // You can enhance this by fetching the actual name from Stripe
      quantity: 1,
    }));

    // 6. Update subscription add-ons
    const updatedSubscription = await updateSubscriptionAddons(
      user.stripeSubscriptionId,
      addOns,
    );

    // 7. Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        addOns: addOns as any,
        subscriptionStatus: updatedSubscription.status,
      },
    });

    // 8. Log audit event
    await logAudit("subscription.addons_updated", userId, {
      stripe_subscription_id: updatedSubscription.id,
      add_ons: addOns,
    });

    // 9. Emit event
    Events.emit("subscription:addons_updated", {
      user_id: userId,
      subscription_id: updatedSubscription.id,
      add_ons: addOns,
    });

    // 10. Return updated subscription
    return NextResponse.json(
      {
        subscription_id: updatedSubscription.id,
        status: updatedSubscription.status,
        add_ons: addOns,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logError("app/api/billing/manage-addons", error, {
      userId: (await auth())?.user?.id,
    });
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
