import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, type PlanKey } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.organizationId;
        const plan = session.metadata?.plan as PlanKey | undefined;

        if (orgId && plan && session.subscription) {
          await db
            .update(organizations)
            .set({
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find org by customer ID
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.stripeCustomerId, customerId),
        });

        if (org) {
          // Update subscription status
          const updates: Record<string, unknown> = {
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date(),
          };

          // If subscription was cancelled, downgrade to starter
          if (subscription.cancel_at_period_end) {
            // Will be downgraded at period end — don't change plan yet
          } else if (subscription.status === "active") {
            // Check price to determine plan
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
              updates.plan = "starter";
            } else if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) {
              updates.plan = "standard";
            } else if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
              updates.plan = "professional";
            } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
              updates.plan = "enterprise";
            }
          }

          await db
            .update(organizations)
            .set(updates)
            .where(eq(organizations.id, org.id));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const org = await db.query.organizations.findFirst({
          where: eq(organizations.stripeCustomerId, customerId),
        });

        if (org) {
          await db
            .update(organizations)
            .set({
              plan: "starter",
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, org.id));
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
