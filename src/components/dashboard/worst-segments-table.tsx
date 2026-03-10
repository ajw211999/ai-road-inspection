"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RoadSegment } from "@/types";
import { PciBadge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface WorstSegmentsTableProps {
  segments: RoadSegment[];
  pciRangeFilter: string | null;
}

function parseRange(range: string): [number, number] {
  const [min, max] = range.split("-").map(Number);
  return [min, max];
}

export function WorstSegmentsTable({ segments, pciRangeFilter }: WorstSegmentsTableProps) {
  const router = useRouter();

  const filtered = useMemo(() => {
    const effectivePci = (s: RoadSegment) =>
      s.humanOverride && s.humanPciScore !== null ? s.humanPciScore : s.pciScore;
    let list = [...segments].sort((a, b) => effectivePci(a) - effectivePci(b));
    if (pciRangeFilter) {
      const [min, max] = parseRange(pciRangeFilter);
      list = list.filter((s) => {
        const pci = effectivePci(s);
        return pci >= min && pci < max;
      });
    }
    return list.slice(0, 10);
  }, [segments, pciRangeFilter]);

  const title = pciRangeFilter
    ? `Segments — PCI ${pciRangeFilter}`
    : "Road Segments — Top Issues";
  const subtitle = pciRangeFilter
    ? `${filtered.length} segment${filtered.length !== 1 ? "s" : ""} in this range`
    : "Lowest PCI scores requiring attention";

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Street
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                PCI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Surface
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                ADA Flag
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                  No segments in this range
                </td>
              </tr>
            ) : (
              filtered.map((seg) => (
                <tr
                  key={seg.id}
                  onClick={() => router.push(`/map?segment=${seg.id}&survey=${seg.surveyId}`)}
                  className="cursor-pointer transition-colors hover:bg-blue-50"
                >
                  <td className="whitespace-nowrap px-6 py-3.5 text-sm font-medium text-gray-900">
                    {seg.streetName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                    {seg.district ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-sm">
                    <PciBadge score={seg.humanOverride && seg.humanPciScore !== null ? seg.humanPciScore : seg.pciScore} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-sm capitalize text-gray-500">
                    {seg.surfaceType}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                    {seg.adaCurbRampFlag ? (
                      <span className="text-orange-600 font-medium">Yes</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right text-sm">
                    <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
