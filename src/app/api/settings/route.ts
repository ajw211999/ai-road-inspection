import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { organizations, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const teamMembers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.organizationId, user.organizationId));

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        stripeCustomerId: org.stripeCustomerId,
        stripeSubscriptionId: org.stripeSubscriptionId,
      },
      teamMembers,
      currentUser: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Settings error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
