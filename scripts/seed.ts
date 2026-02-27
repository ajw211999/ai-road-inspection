/**
 * Mock Data Seed Script
 *
 * Seeds the PostgreSQL database with realistic fake data:
 * - 1 organization (City of Austin)
 * - 3 users (admin, manager, inspector)
 * - 1 completed survey
 * - 50 road segments with PCI scores across Austin, TX
 * - 250 frames (5 per segment) with AI analysis data
 *
 * Usage: npx tsx scripts/seed.ts
 * Requires: DATABASE_URL in .env.local
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

const STREETS = [
  "Congress Ave", "Lamar Blvd", "Guadalupe St", "Red River St",
  "Cesar Chavez St", "MLK Jr Blvd", "Riverside Dr", "Barton Springs Rd",
  "S 1st St", "S Congress Ave", "E 6th St", "E 7th St",
  "Manor Rd", "Airport Blvd", "Burnet Rd", "Anderson Ln",
  "Research Blvd", "Oltorf St", "William Cannon Dr", "Slaughter Ln",
  "Parmer Ln", "Braker Ln", "Rundberg Ln", "Stassney Ln",
  "Ben White Blvd", "N Lamar Blvd", "Metric Blvd", "Duval St",
  "Speedway", "Dean Keeton St", "E Riverside Dr", "Pleasant Valley Rd",
  "Montopolis Dr", "Springdale Rd", "Cameron Rd", "N IH-35 Frontage",
  "Manchaca Rd", "S Lamar Blvd", "Exposition Blvd", "Lake Austin Blvd",
  "Enfield Rd", "W 5th St", "W 6th St", "Rainey St",
  "Trinity St", "Brazos St", "San Jacinto Blvd", "Nueces St",
  "Rio Grande St", "West Ave",
];

const DISTRICTS = [
  "District 1", "District 2", "District 3", "District 4", "District 5",
  "District 6", "District 7", "District 8", "District 9", "District 10",
];

const DISTRESS_TYPES = [
  "alligator_cracking", "longitudinal_cracking", "transverse_cracking",
  "pothole", "rutting", "bleeding", "raveling", "patch_deterioration",
  "depression", "edge_cracking", "none",
] as const;

const SEVERITIES = ["low", "medium", "high"] as const;
const SURFACE_TYPES = ["asphalt", "concrete", "gravel"] as const;

const BASE_LAT = 30.267;
const BASE_LNG = -97.743;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set. Copy .env.local and fill in your database URL.");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding database...\n");

  // 1. Organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "City of Austin — Public Works",
      slug: "city-of-austin",
      plan: "professional",
    })
    .returning();

  console.log(`Created organization: ${org.name} (${org.id})`);

  // 2. Users
  const usersData = [
    { clerkId: "clerk_seed_admin", email: "antoine@example.com", firstName: "Antoine", lastName: "D.", role: "admin" as const },
    { clerkId: "clerk_seed_manager", email: "maria@example.com", firstName: "Maria", lastName: "G.", role: "manager" as const },
    { clerkId: "clerk_seed_inspector", email: "james@example.com", firstName: "James", lastName: "P.", role: "inspector" as const },
  ];

  const insertedUsers = await db
    .insert(schema.users)
    .values(usersData.map((u) => ({ ...u, organizationId: org.id })))
    .returning();

  console.log(`Created ${insertedUsers.length} users`);

  // 3. Survey
  const [survey] = await db
    .insert(schema.surveys)
    .values({
      organizationId: org.id,
      createdById: insertedUsers[0].id,
      name: "Downtown Austin Q1 2026 Survey",
      description: "Comprehensive road condition assessment of downtown Austin streets covering Districts 1-4.",
      status: "completed",
      totalFrames: 250,
      processedFrames: 250,
      totalSegments: 50,
      averagePci: 0, // updated after segments
      processingCost: 12.47,
      startedAt: new Date("2026-01-15T08:00:00Z"),
      completedAt: new Date("2026-01-15T09:23:00Z"),
    })
    .returning();

  console.log(`Created survey: ${survey.name}`);

  // 4. Road Segments (50)
  const segmentsData = STREETS.map((street, i) => {
    const startLat = BASE_LAT + (Math.random() - 0.5) * 0.06;
    const startLng = BASE_LNG + (Math.random() - 0.5) * 0.08;
    const bearing = Math.random() * Math.PI * 2;
    const lengthDeg = 0.002 + Math.random() * 0.003;
    const endLat = startLat + Math.cos(bearing) * lengthDeg;
    const endLng = startLng + Math.sin(bearing) * lengthDeg;

    return {
      surveyId: survey.id,
      organizationId: org.id,
      streetName: street,
      segmentIndex: i,
      startLat,
      startLng,
      endLat,
      endLng,
      lengthFt: 200 + Math.floor(Math.random() * 800),
      widthFt: 24 + Math.floor(Math.random() * 24),
      surfaceType: pick(SURFACE_TYPES),
      pciScore: Math.floor(Math.random() * 100),
      district: pick(DISTRICTS),
      adaCurbRampFlag: Math.random() > 0.7,
      geometry: {
        type: "LineString",
        coordinates: [
          [startLng, startLat],
          [endLng, endLat],
        ],
      },
    };
  });

  const insertedSegments = await db
    .insert(schema.roadSegments)
    .values(segmentsData)
    .returning();

  console.log(`Created ${insertedSegments.length} road segments`);

  // Update survey average PCI
  const avgPci = Math.round(
    insertedSegments.reduce((s, seg) => s + seg.pciScore, 0) /
      insertedSegments.length
  );

  await db
    .update(schema.surveys)
    .set({ averagePci: avgPci })
    .where(eq(schema.surveys.id, survey.id));

  // 5. Frames (5 per segment = 250)
  const framesData = insertedSegments.flatMap((segment, si) =>
    Array.from({ length: 5 }, (_, fi) => {
      const t = fi / 4;
      const lat = segment.startLat + (segment.endLat - segment.startLat) * t;
      const lng = segment.startLng + (segment.endLng - segment.startLng) * t;
      const distress = pick(DISTRESS_TYPES);
      const pci = distress === "none" ? 80 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 70);

      return {
        surveyId: survey.id,
        segmentId: segment.id,
        frameIndex: si * 5 + fi,
        imageUrl: `https://placeholder.r2.dev/frames/${si}_${fi}.jpg`,
        lat,
        lng,
        heading: Math.floor(Math.random() * 360),
        distressType: distress,
        severity: distress === "none" ? ("low" as const) : pick(SEVERITIES),
        confidence: parseFloat((0.6 + Math.random() * 0.39).toFixed(3)),
        pciScore: pci,
        aiRawResponse: {
          model: "gpt-4o",
          distresses: distress === "none" ? [] : [{ type: distress, confidence: 0.6 + Math.random() * 0.39 }],
        },
        humanOverride: Math.random() > 0.9,
        humanPciScore: Math.random() > 0.9 ? Math.floor(Math.random() * 100) : null,
        humanNotes: Math.random() > 0.95 ? "Needs re-inspection — shadow artifact" : null,
        flaggedForReview: Math.random() > 0.85,
      };
    })
  );

  // Insert frames in batches of 50
  for (let i = 0; i < framesData.length; i += 50) {
    await db.insert(schema.frames).values(framesData.slice(i, i + 50));
  }

  console.log(`Created ${framesData.length} frames`);
  console.log(`\nSeed complete! Average PCI: ${avgPci}`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
