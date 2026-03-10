"use client";

import { useState, useEffect } from "react";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { PciDistributionChart } from "@/components/dashboard/pci-distribution-chart";
import { WorstSegmentsTable } from "@/components/dashboard/worst-segments-table";
import { AdaAlertsCard } from "@/components/dashboard/ada-alerts-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { RoadSegment, PciDistributionBucket } from "@/types";

interface DashboardData {
  organization: { name: string; plan: string } | null;
  totalSurveys: number;
  totalSegments: number;
  averagePci: number;
  totalLengthFt: number;
  goodConditionPct: number;
  adaAlerts: number;
  pciDistribution: PciDistributionBucket[];
  worstSegments: RoadSegment[];
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

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
      {/* Header */}
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
      </div>

      {/* Metrics Row */}
      <div className="mt-6">
        <MetricsCards
          totalMilesSurveyed={data.totalLengthFt}
          averagePci={data.averagePci}
          goodConditionPct={data.goodConditionPct}
          totalSurveys={data.totalSurveys}
          adaAlerts={data.adaAlerts}
        />
      </div>

      {hasData ? (
        <>
          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PciDistributionChart data={data.pciDistribution} />
            </div>
            <div>
              <AdaAlertsCard
                count={data.adaAlerts}
                total={data.totalSegments}
              />
            </div>
          </div>

          {/* Worst Segments Table */}
          <div className="mt-8">
            <WorstSegmentsTable segments={data.worstSegments} />
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
