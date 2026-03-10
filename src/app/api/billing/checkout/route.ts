import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const plan = body.plan as PlanKey;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Use: starter, standard, professional, enterprise" },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Price not configured for this plan. Set STRIPE_*_PRICE_ID env vars." },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        name: org.name,
        email: user.email,
        metadata: {
          organizationId: org.id,
        },
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(organizations.id, org.id));
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
      metadata: {
        organizationId: org.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
