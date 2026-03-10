"use client";

import { useState, useEffect, useCallback } from "react";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { PciDistributionChart } from "@/components/dashboard/pci-distribution-chart";
import { WorstSegmentsTable } from "@/components/dashboard/worst-segments-table";
import { AdaAlertsCard } from "@/components/dashboard/ada-alerts-card";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ChevronDown } from "lucide-react";
import type { RoadSegment, PciDistributionBucket } from "@/types";

interface SurveyOption {
  id: string;
  name: string;
  status: string;
  completedAt: string | null;
  averagePci: number | null;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string | null;
}

interface DashboardData {
  organization: { name: string; plan: string } | null;
  surveys: SurveyOption[];
  totalSurveys: number;
  totalSegments: number;
  averagePci: number;
  totalLengthFt: number;
  goodConditionPct: number;
  adaAlerts: number;
  pciDistribution: PciDistributionBucket[];
  worstSegments: RoadSegment[];
  recentActivity: ActivityItem[];
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all");
  const [pciRange, setPciRange] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedSurvey !== "all" ? `?surveyId=${selectedSurvey}` : "";
      const res = await fetch(`/api/dashboard${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSurvey]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Reset PCI range filter when survey changes
  useEffect(() => {
    setPciRange(null);
  }, [selectedSurvey]);

  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">Unable to load dashboard</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const hasData = data.totalSegments > 0;

  return (
    <>
      {/* Header with survey selector */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {data.organization?.name ?? "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {hasData
              ? `${data.totalSegments} segments across ${data.totalSurveys} surveys`
              : "Upload your first survey to see road condition data"}
          </p>
        </div>
        {data.surveys.length > 0 && (
          <div className="relative">
            <select
              value={selectedSurvey}
              onChange={(e) => setSelectedSurvey(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Surveys</option>
              {data.surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.averagePci !== null ? `(PCI ${s.averagePci})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="mt-6">
        <MetricsCards
          totalMilesSurveyed={data.totalLengthFt}
          averagePci={data.averagePci}
          goodConditionPct={data.goodConditionPct}
          totalSurveys={data.totalSurveys}
          adaAlerts={data.adaAlerts}
          loading={loading}
        />
      </div>

      {hasData ? (
        <>
          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PciDistributionChart
                data={data.pciDistribution}
                activeRange={pciRange}
                onBarClick={setPciRange}
              />
            </div>
            <div>
              <AdaAlertsCard
                count={data.adaAlerts}
                total={data.totalSegments}
              />
            </div>
          </div>

          {/* Worst Segments + Activity */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WorstSegmentsTable
                segments={data.worstSegments}
                pciRangeFilter={pciRange}
              />
            </div>
            <div>
              <RecentActivityFeed activity={data.recentActivity} />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-gray-400">
          <p className="text-lg font-medium">No inspection data yet</p>
          <p className="mt-1 text-sm">
            Go to Surveys to upload your first dashcam video.
          </p>
        </div>
      )}
    </>
  );
}
