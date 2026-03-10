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
  activeRange: string | null;
  onBarClick: (range: string | null) => void;
}

export function PciDistributionChart({ data, activeRange, onBarClick }: PciDistributionChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">
            PCI Score Distribution
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Click a bar to filter the segments table below
          </p>
        </div>
        {activeRange && (
          <button
            onClick={() => onBarClick(null)}
            className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
          >
            Showing: {activeRange} &times;
          </button>
        )}
      </div>
      <div className="mt-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            style={{ cursor: "pointer" }}
            onClick={(state) => {
              if (state?.activeLabel) {
                const clicked = state.activeLabel as string;
                onBarClick(clicked === activeRange ? null : clicked);
              }
            }}
          >
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
                <Cell
                  key={index}
                  fill={entry.color}
                  opacity={activeRange && activeRange !== entry.range ? 0.3 : 1}
                  stroke={activeRange === entry.range ? "#1d4ed8" : "none"}
                  strokeWidth={activeRange === entry.range ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
