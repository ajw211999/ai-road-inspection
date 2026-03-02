import type {
  Survey,
  RoadSegment,
  Frame,
  DashboardStats,
  PciDistributionBucket,
  DistressType,
  SeverityLevel,
  SegmentSurfaceType,
} from "@/types";

// ============================================================
// Mock Data for Development
// Austin, TX area coordinates
// ============================================================

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

const DISTRESS_TYPES: DistressType[] = [
  "alligator_cracking", "longitudinal_cracking", "transverse_cracking",
  "pothole", "rutting", "bleeding", "raveling", "patch_deterioration",
  "depression", "edge_cracking", "none",
];

const SEVERITIES: SeverityLevel[] = ["low", "medium", "high"];
const SURFACE_TYPES: SegmentSurfaceType[] = ["asphalt", "concrete", "gravel"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = seededRandom(42);

function randomId(): string {
  const chars = "0123456789abcdef";
  const sections = [8, 4, 4, 4, 12];
  return sections
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(rand() * 16)]).join("")
    )
    .join("-");
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// Base coordinates — Austin, TX
const BASE_LAT = 30.267;
const BASE_LNG = -97.743;

// ---------- Generate Mock Survey ----------

export const mockSurvey: Survey = {
  id: randomId(),
  organizationId: randomId(),
  createdById: randomId(),
  name: "Downtown Austin Q1 2026 Survey",
  description: "Comprehensive road condition assessment of downtown Austin streets covering Districts 1-4.",
  status: "completed",
  videoUrl: null,
  totalFrames: 250,
  processedFrames: 250,
  totalSegments: 50,
  averagePci: 0, // calculated below
  processingCost: 12.47,
  startedAt: new Date("2026-01-15T08:00:00Z"),
  completedAt: new Date("2026-01-15T09:23:00Z"),
  createdAt: new Date("2026-01-15T07:55:00Z"),
  updatedAt: new Date("2026-01-15T09:23:00Z"),
};

// ---------- Generate 50 Road Segments ----------

export const mockSegments: RoadSegment[] = Array.from(
  { length: 50 },
  (_, i) => {
    const startLat = BASE_LAT + (rand() - 0.5) * 0.06;
    const startLng = BASE_LNG + (rand() - 0.5) * 0.08;
    const bearing = rand() * Math.PI * 2;
    const lengthDeg = 0.002 + rand() * 0.003;
    const endLat = startLat + Math.cos(bearing) * lengthDeg;
    const endLng = startLng + Math.sin(bearing) * lengthDeg;

    const pci = Math.floor(rand() * 100);

    return {
      id: randomId(),
      surveyId: mockSurvey.id,
      organizationId: mockSurvey.organizationId,
      streetName: STREETS[i],
      segmentIndex: i,
      startLat,
      startLng,
      endLat,
      endLng,
      lengthFt: 200 + Math.floor(rand() * 800),
      widthFt: 24 + Math.floor(rand() * 24),
      surfaceType: randomFromArray(SURFACE_TYPES),
      pciScore: pci,
      district: randomFromArray(DISTRICTS),
      adaCurbRampFlag: rand() > 0.7,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [startLng, startLat],
          [endLng, endLat],
        ],
      },
      createdAt: new Date("2026-01-15T09:00:00Z"),
      updatedAt: new Date("2026-01-15T09:00:00Z"),
    };
  }
);

// Update survey average PCI
const totalPci = mockSegments.reduce((sum, s) => sum + s.pciScore, 0);
mockSurvey.averagePci = Math.round(totalPci / mockSegments.length);

// ---------- Generate Frames (5 per segment = 250 total) ----------

export const mockFrames: Frame[] = mockSegments.flatMap((segment, si) =>
  Array.from({ length: 5 }, (_, fi) => {
    const t = fi / 4;
    const lat = segment.startLat + (segment.endLat - segment.startLat) * t;
    const lng = segment.startLng + (segment.endLng - segment.startLng) * t;
    const distress = randomFromArray(DISTRESS_TYPES);
    const pci =
      distress === "none"
        ? 80 + Math.floor(rand() * 20)
        : Math.floor(rand() * 70);

    return {
      id: randomId(),
      surveyId: mockSurvey.id,
      segmentId: segment.id,
      frameIndex: si * 5 + fi,
      imageUrl: `https://placeholder.r2.dev/frames/${si}_${fi}.jpg`,
      lat,
      lng,
      heading: Math.floor(rand() * 360),
      distressType: distress,
      severity: distress === "none" ? "low" : randomFromArray(SEVERITIES),
      confidence: 0.6 + rand() * 0.39,
      pciScore: pci,
      aiRawResponse: {
        model: "gpt-4o",
        distresses: distress === "none" ? [] : [{ type: distress, confidence: 0.6 + rand() * 0.39 }],
      },
      humanOverride: rand() > 0.9,
      humanPciScore: rand() > 0.9 ? Math.floor(rand() * 100) : null,
      humanNotes: rand() > 0.95 ? "Needs re-inspection — shadow artifact" : null,
      flaggedForReview: rand() > 0.85,
      createdAt: new Date("2026-01-15T09:00:00Z"),
      updatedAt: new Date("2026-01-15T09:00:00Z"),
    } satisfies Frame;
  })
);

// ---------- Dashboard Stats ----------

function buildPciDistribution(): PciDistributionBucket[] {
  const buckets = [
    { range: "0-10", color: "#991b1b" },
    { range: "10-25", color: "#ef4444" },
    { range: "25-40", color: "#f97316" },
    { range: "40-55", color: "#eab308" },
    { range: "55-70", color: "#84cc16" },
    { range: "70-85", color: "#22c55e" },
    { range: "85-100", color: "#15803d" },
  ];

  return buckets.map(({ range, color }) => {
    const [min, max] = range.split("-").map(Number);
    const count = mockSegments.filter(
      (s) => s.pciScore >= min && s.pciScore < max
    ).length;
    return { range, count, color };
  });
}

export const mockDashboardStats: DashboardStats = {
  totalSurveys: 1,
  totalSegments: mockSegments.length,
  averagePci: mockSurvey.averagePci!,
  segmentsNeedingAttention: mockSegments.filter((s) => s.pciScore < 40).length,
  recentSurveys: [mockSurvey],
  pciDistribution: buildPciDistribution(),
};

// ---------- Additional Mock Data for Phase 2B ----------

export const mockOrganization = {
  id: mockSurvey.organizationId,
  name: "City of Austin — Public Works",
  slug: "city-of-austin",
  logoUrl: null,
  plan: "professional" as const,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date("2025-06-01T00:00:00Z"),
  updatedAt: new Date("2025-06-01T00:00:00Z"),
};

export const mockTotalMilesSurveyed = mockSegments.reduce(
  (sum, s) => sum + s.lengthFt,
  0
);

export const mockConditionBreakdown = {
  good: mockSegments.filter((s) => s.pciScore >= 85).length,
  satisfactory: mockSegments.filter(
    (s) => s.pciScore >= 70 && s.pciScore < 85
  ).length,
  fair: mockSegments.filter(
    (s) => s.pciScore >= 55 && s.pciScore < 70
  ).length,
  poor: mockSegments.filter(
    (s) => s.pciScore >= 40 && s.pciScore < 55
  ).length,
  failed: mockSegments.filter((s) => s.pciScore < 40).length,
};

export const mockAdaAlertsCount = mockSegments.filter(
  (s) => s.adaCurbRampFlag
).length;
