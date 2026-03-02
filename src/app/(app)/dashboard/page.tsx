import {
  mockDashboardStats,
  mockSegments,
  mockOrganization,
  mockTotalMilesSurveyed,
  mockAdaAlertsCount,
} from "@/lib/mock-data";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { PciDistributionChart } from "@/components/dashboard/pci-distribution-chart";
import { WorstSegmentsTable } from "@/components/dashboard/worst-segments-table";
import { AdaAlertsCard } from "@/components/dashboard/ada-alerts-card";

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const goodPct =
    stats.totalSegments > 0
      ? Math.round(
          (mockSegments.filter((s) => s.pciScore >= 70).length /
            stats.totalSegments) *
            100
        )
      : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {mockOrganization.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Road condition overview — Downtown Austin Q1 2026 Survey
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-6">
        <MetricsCards
          totalMilesSurveyed={mockTotalMilesSurveyed}
          averagePci={stats.averagePci}
          goodConditionPct={goodPct}
          totalSurveys={stats.totalSurveys}
          adaAlerts={mockAdaAlertsCount}
        />
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PciDistributionChart data={stats.pciDistribution} />
        </div>
        <div>
          <AdaAlertsCard
            count={mockAdaAlertsCount}
            total={stats.totalSegments}
          />
        </div>
      </div>

      {/* Worst Segments Table */}
      <div className="mt-8">
        <WorstSegmentsTable segments={mockSegments} />
      </div>
    </div>
  );
}
