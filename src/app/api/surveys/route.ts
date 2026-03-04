import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();

    const results = await db
      .select()
      .from(surveys)
      .where(eq(surveys.organizationId, user.organizationId))
      .orderBy(desc(surveys.createdAt));

    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch surveys";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Surveys fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
