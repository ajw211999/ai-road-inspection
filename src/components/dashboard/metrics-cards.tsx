import { StatCard } from "@/components/ui/stat-card";
import { pciColor, pciLabel, formatMiles } from "@/lib/utils";
import {
  BarChart3,
  MapPin,
  Activity,
  Accessibility,
} from "lucide-react";

interface MetricsCardsProps {
  totalMilesSurveyed: number;
  averagePci: number;
  goodConditionPct: number;
  totalSurveys: number;
  adaAlerts: number;
  loading?: boolean;
}

export function MetricsCards({
  totalMilesSurveyed,
  averagePci,
  goodConditionPct,
  totalSurveys,
  adaAlerts,
  loading = false,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Miles Surveyed"
        value={formatMiles(totalMilesSurveyed)}
        icon={MapPin}
        subtitle="Total road miles"
        loading={loading}
      />
      <StatCard
        label="Average PCI"
        value={averagePci}
        color={pciColor(averagePci)}
        icon={Activity}
        subtitle={pciLabel(averagePci)}
        loading={loading}
      />
      <StatCard
        label="Good Condition"
        value={`${goodConditionPct}%`}
        color="#22c55e"
        icon={BarChart3}
        subtitle="PCI ≥ 70"
        loading={loading}
      />
      <StatCard
        label="Surveys"
        value={totalSurveys}
        icon={BarChart3}
        subtitle="Completed surveys"
        loading={loading}
      />
      <StatCard
        label="ADA Alerts"
        value={adaAlerts}
        color={adaAlerts > 0 ? "#f97316" : undefined}
        icon={Accessibility}
        subtitle="Curb ramp issues"
        loading={loading}
      />
    </div>
  );
}
