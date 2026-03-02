"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PciDistributionBucket } from "@/types";

interface PciDistributionChartProps {
  data: PciDistributionBucket[];
}

export function PciDistributionChart({ data }: PciDistributionChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-[var(--color-primary)]">
        PCI Score Distribution
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Number of road segments by condition rating
      </p>
      <div className="mt-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 13,
              }}
              formatter={(value) => [`${value} segments`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
