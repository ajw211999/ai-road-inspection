// ============================================================
// AI Road Inspection SaaS — TypeScript Interfaces
// 6 core tables + API types
// ============================================================

// ---------- Enums ----------

export type SurveyStatus = "uploading" | "processing" | "completed" | "failed";

export type DistressType =
  | "alligator_cracking"
  | "longitudinal_cracking"
  | "transverse_cracking"
  | "pothole"
  | "rutting"
  | "bleeding"
  | "raveling"
  | "patch_deterioration"
  | "depression"
  | "edge_cracking"
  | "none";

export type SeverityLevel = "low" | "medium" | "high";

export type ReportFormat = "pdf" | "pptx" | "shapefile" | "csv";

export type ReportStatus = "generating" | "completed" | "failed";

export type SegmentSurfaceType = "asphalt" | "concrete" | "gravel" | "unpaved";

// ---------- Organization ----------

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: "starter" | "professional" | "enterprise";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- User ----------

export interface User {
  id: string;
  clerkId: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "manager" | "inspector" | "viewer";
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Survey ----------

export interface Survey {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  description: string | null;
  status: SurveyStatus;
  videoUrl: string | null;
  totalFrames: number;
  processedFrames: number;
  totalSegments: number;
  averagePci: number | null;
  processingCost: number; // API cost tracking
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Road Segment ----------

export interface RoadSegment {
  id: string;
  surveyId: string;
  organizationId: string;
  streetName: string;
  segmentIndex: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  lengthFt: number;
  widthFt: number | null;
  surfaceType: SegmentSurfaceType;
  pciScore: number; // 0-100
  district: string | null; // equity analysis
  adaCurbRampFlag: boolean; // ADA compliance flagging
  geometry: GeoJSON.LineString | null; // PostGIS linestring
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Frame ----------

export interface Frame {
  id: string;
  surveyId: string;
  segmentId: string;
  frameIndex: number;
  imageUrl: string; // Cloudflare R2
  lat: number;
  lng: number;
  heading: number | null;
  distressType: DistressType;
  severity: SeverityLevel;
  confidence: number; // 0-1
  pciScore: number; // 0-100
  aiRawResponse: Record<string, unknown>; // audit trail
  humanOverride: boolean; // field verification
  humanPciScore: number | null;
  humanNotes: string | null;
  flaggedForReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Report ----------

export interface Report {
  id: string;
  surveyId: string;
  organizationId: string;
  createdById: string;
  name: string;
  format: ReportFormat;
  status: ReportStatus;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  config: ReportConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  includeMap: boolean;
  includePhotos: boolean;
  includePciChart: boolean;
  includeDistressBreakdown: boolean;
  includeBudgetScenarios: boolean;
  dateRange?: { start: string; end: string };
  segmentIds?: string[];
}

// ---------- API Types ----------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSurveyRequest {
  name: string;
  description?: string;
}

export interface UpdateFrameVerificationRequest {
  humanOverride: boolean;
  humanPciScore?: number;
  humanNotes?: string;
  flaggedForReview?: boolean;
}

export interface GenerateReportRequest {
  surveyId: string;
  name: string;
  format: ReportFormat;
  config: ReportConfig;
}

// ---------- Dashboard Stats ----------

export interface DashboardStats {
  totalSurveys: number;
  totalSegments: number;
  averagePci: number;
  segmentsNeedingAttention: number; // PCI < 40
  recentSurveys: Survey[];
  pciDistribution: PciDistributionBucket[];
}

export interface PciDistributionBucket {
  range: string; // e.g. "0-10", "10-20"
  count: number;
  color: string;
}

// ---------- Map Types ----------

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface SegmentFeature {
  type: "Feature";
  geometry: GeoJSON.LineString;
  properties: {
    id: string;
    streetName: string;
    pciScore: number;
    surfaceType: SegmentSurfaceType;
    district: string | null;
    adaCurbRampFlag: boolean;
  };
}
