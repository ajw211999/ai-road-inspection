import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage billing" },
        { status: 403 }
      );
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
    });

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create portal session";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Portal error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
