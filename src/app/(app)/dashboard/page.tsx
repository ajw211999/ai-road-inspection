import { mockDashboardStats, mockSegments } from "@/lib/mock-data";
import { pciColor, pciLabel } from "@/lib/utils";

export default function DashboardPage() {
  const stats = mockDashboardStats;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Overview of your road inspection data
      </p>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Surveys" value={stats.totalSurveys} />
        <StatCard label="Road Segments" value={stats.totalSegments} />
        <StatCard
          label="Average PCI"
          value={stats.averagePci}
          color={pciColor(stats.averagePci)}
          subtitle={pciLabel(stats.averagePci)}
        />
        <StatCard
          label="Needs Attention"
          value={stats.segmentsNeedingAttention}
          color="#ef4444"
          subtitle="PCI < 40"
        />
      </div>

      {/* PCI Distribution */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          PCI Score Distribution
        </h2>
        <div className="mt-4 flex items-end gap-2" style={{ height: 200 }}>
          {stats.pciDistribution.map((bucket) => {
            const maxCount = Math.max(
              ...stats.pciDistribution.map((b) => b.count),
              1
            );
            const height = (bucket.count / maxCount) * 100;
            return (
              <div key={bucket.range} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-600">
                  {bucket.count}
                </span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${height}%`,
                    backgroundColor: bucket.color,
                    minHeight: bucket.count > 0 ? 8 : 0,
                  }}
                />
                <span className="text-xs text-gray-500">{bucket.range}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Segments Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Road Segments — Top Issues
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Street
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  District
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  PCI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Surface
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  ADA Flag
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {mockSegments
                .sort((a, b) => a.pciScore - b.pciScore)
                .slice(0, 10)
                .map((seg) => (
                  <tr key={seg.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {seg.streetName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {seg.district ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: pciColor(seg.pciScore) }}
                      >
                        {seg.pciScore}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-gray-500">
                      {seg.surfaceType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {seg.adaCurbRampFlag ? "Yes" : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: color ?? "#111827" }}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
