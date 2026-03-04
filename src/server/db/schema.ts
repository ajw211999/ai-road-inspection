import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// Enums
// ============================================================

export const planEnum = pgEnum("plan", [
  "starter",
  "professional",
  "enterprise",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "inspector",
  "viewer",
]);

export const surveyStatusEnum = pgEnum("survey_status", [
  "uploading",
  "processing",
  "completed",
  "failed",
]);

export const distressTypeEnum = pgEnum("distress_type", [
  "alligator_cracking",
  "longitudinal_cracking",
  "transverse_cracking",
  "pothole",
  "rutting",
  "bleeding",
  "raveling",
  "patch_deterioration",
  "depression",
  "edge_cracking",
  "none",
]);

export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);

export const surfaceTypeEnum = pgEnum("surface_type", [
  "asphalt",
  "concrete",
  "gravel",
  "unpaved",
]);

export const reportFormatEnum = pgEnum("report_format", [
  "pdf",
  "pptx",
  "shapefile",
  "csv",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "generating",
  "completed",
  "failed",
]);

// ============================================================
// Tables
// ============================================================

// ---------- Organizations ----------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: text("logo_url"),
  plan: planEnum("plan").default("starter").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- Users ----------

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    role: userRoleEnum("role").default("viewer").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("users_org_idx").on(table.organizationId)]
);

// ---------- Surveys ----------

export const surveys = pgTable(
  "surveys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    createdById: uuid("created_by_id")
      .references(() => users.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: surveyStatusEnum("status").default("uploading").notNull(),
    videoUrl: text("video_url"),
    totalFrames: integer("total_frames").default(0).notNull(),
    processedFrames: integer("processed_frames").default(0).notNull(),
    totalSegments: integer("total_segments").default(0).notNull(),
    averagePci: real("average_pci"),
    processingCost: real("processing_cost").default(0).notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("surveys_org_idx").on(table.organizationId)]
);

// ---------- Road Segments ----------

export const roadSegments = pgTable(
  "road_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .references(() => surveys.id)
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    streetName: varchar("street_name", { length: 255 }).notNull(),
    segmentIndex: integer("segment_index").notNull(),
    startLat: real("start_lat").notNull(),
    startLng: real("start_lng").notNull(),
    endLat: real("end_lat").notNull(),
    endLng: real("end_lng").notNull(),
    lengthFt: real("length_ft").notNull(),
    widthFt: real("width_ft"),
    surfaceType: surfaceTypeEnum("surface_type").default("asphalt").notNull(),
    pciScore: integer("pci_score").notNull(),
    district: varchar("district", { length: 100 }), // equity analysis
    adaCurbRampFlag: boolean("ada_curb_ramp_flag").default(false).notNull(),
    // PostGIS geometry stored as GeoJSON in jsonb for portability
    // Upgrade to native geometry column when PostGIS extension is enabled
    geometry: jsonb("geometry"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("segments_survey_idx").on(table.surveyId),
    index("segments_org_idx").on(table.organizationId),
    index("segments_pci_idx").on(table.pciScore),
  ]
);

// ---------- Frames ----------

export const frames = pgTable(
  "frames",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .references(() => surveys.id)
      .notNull(),
    segmentId: uuid("segment_id")
      .references(() => roadSegments.id),
    frameIndex: integer("frame_index").notNull(),
    imageUrl: text("image_url").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    heading: real("heading"),
    distressType: distressTypeEnum("distress_type").default("none").notNull(),
    severity: severityEnum("severity").default("low").notNull(),
    confidence: real("confidence").default(0).notNull(),
    pciScore: integer("pci_score").default(0).notNull(),
    aiRawResponse: jsonb("ai_raw_response").default({}).notNull(), // audit trail
    humanOverride: boolean("human_override").default(false).notNull(),
    humanPciScore: integer("human_pci_score"),
    humanNotes: text("human_notes"),
    flaggedForReview: boolean("flagged_for_review").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("frames_survey_idx").on(table.surveyId),
    index("frames_segment_idx").on(table.segmentId),
    index("frames_flagged_idx").on(table.flaggedForReview),
  ]
);

// ---------- Reports ----------

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .references(() => surveys.id)
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    createdById: uuid("created_by_id")
      .references(() => users.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    format: reportFormatEnum("format").notNull(),
    status: reportStatusEnum("status").default("generating").notNull(),
    fileUrl: text("file_url"),
    fileSizeBytes: integer("file_size_bytes"),
    config: jsonb("config").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("reports_survey_idx").on(table.surveyId),
    index("reports_org_idx").on(table.organizationId),
  ]
);

// ============================================================
// Relations
// ============================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  surveys: many(surveys),
  roadSegments: many(roadSegments),
  reports: many(reports),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  surveys: many(surveys),
  reports: many(reports),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [surveys.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [surveys.createdById],
    references: [users.id],
  }),
  roadSegments: many(roadSegments),
  frames: many(frames),
  reports: many(reports),
}));

export const roadSegmentsRelations = relations(
  roadSegments,
  ({ one, many }) => ({
    survey: one(surveys, {
      fields: [roadSegments.surveyId],
      references: [surveys.id],
    }),
    organization: one(organizations, {
      fields: [roadSegments.organizationId],
      references: [organizations.id],
    }),
    frames: many(frames),
  })
);

export const framesRelations = relations(frames, ({ one }) => ({
  survey: one(surveys, {
    fields: [frames.surveyId],
    references: [surveys.id],
  }),
  segment: one(roadSegments, {
    fields: [frames.segmentId],
    references: [roadSegments.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  survey: one(surveys, {
    fields: [reports.surveyId],
    references: [surveys.id],
  }),
  organization: one(organizations, {
    fields: [reports.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [reports.createdById],
    references: [users.id],
  }),
}));
