# GroundTruth AI — Project Context

## What This Is
GroundTruth AI — AI-powered road inspection SaaS platform for Texas municipalities. Converts dashcam video into PCI (Pavement Condition Index) scores, distress maps, and actionable reports.

## Tech Stack
- **Framework**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Database**: PostgreSQL + PostGIS on Railway, Drizzle ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **Storage**: Cloudflare R2
- **AI**: GPT-4o (primary), Claude Vision (fallback)
- **Maps**: Mapbox GL JS
- **Jobs**: Inngest (video → frames → AI pipeline)
- **Reports**: Puppeteer (PDF), pptxgenjs (PPTX), shp-write (Shapefile)
- **Monitoring**: Sentry + PostHog
- **Deploy**: Vercel (app) + Railway (DB)

## Project Structure
```
src/
  app/              # Next.js App Router pages
    dashboard/      # Main dashboard with stats
    map/            # Interactive Mapbox map view
    surveys/        # Survey management (upload, list, detail)
    reports/        # Report generation and download
    settings/       # Org settings, billing, users
  components/
    layout/         # Sidebar, header, app shell
    ui/             # Shared UI primitives
    dashboard/      # Dashboard-specific components
    map/            # Map-specific components
    surveys/        # Survey-specific components
    reports/        # Report-specific components
  lib/              # Shared utilities
  server/
    db/             # Drizzle schema, connection, migrations
  types/            # TypeScript interfaces
scripts/            # Seed data, utilities
```

## Database Tables (6)
1. **organizations** — Multi-tenant orgs with Stripe billing
2. **users** — Clerk-synced users with roles (admin/manager/inspector/viewer)
3. **surveys** — Video uploads with processing status and cost tracking
4. **road_segments** — Individual road segments with PCI scores, district, ADA flags
5. **frames** — Extracted video frames with AI analysis + human override fields
6. **reports** — Generated reports in PDF/PPTX/Shapefile/CSV formats

## Key Differentiators
- **Field verification workflow**: human_override, human_pci_score, flagged_for_review on frames
- **ADA curb ramp flagging**: ada_curb_ramp_flag on road_segments
- **District equity analysis**: district field for geographic equity reporting
- **AI audit trail**: ai_raw_response stored as JSONB on every frame
- **Processing cost tracking**: processing_cost on surveys

## Commands
- `npm run dev` — Start dev server
- `npx drizzle-kit push` — Push schema to database
- `npx drizzle-kit generate` — Generate migration files
- `npx tsx scripts/seed.ts` — Seed mock data

## Conventions
- Use `@/*` import alias (maps to `src/*`)
- Server components by default, `"use client"` only when needed
- Tailwind for all styling, no CSS modules
- API routes in `src/app/api/`
- Drizzle queries in server components or API routes only
