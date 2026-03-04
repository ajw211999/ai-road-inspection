import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { users, organizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getOrCreateCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Not authenticated");
  }

  // Look up existing DB user
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (existing) {
    return existing;
  }

  // Auto-create organization + user (MVP convenience)
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ?? "unknown@example.com";
  const firstName = clerkUser?.firstName ?? null;
  const lastName = clerkUser?.lastName ?? null;

  const slug = `org-${clerkId.slice(-8)}-${Date.now()}`;

  const [org] = await db
    .insert(organizations)
    .values({
      name: `${firstName ?? "My"}'s Organization`,
      slug,
    })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      clerkId,
      organizationId: org.id,
      email,
      firstName,
      lastName,
      role: "admin",
    })
    .returning();

  return user;
}
