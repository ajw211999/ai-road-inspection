import { Accessibility } from "lucide-react";

interface AdaAlertsCardProps {
  count: number;
  total: number;
}

export function AdaAlertsCard({ count, total }: AdaAlertsCardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <Accessibility className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-orange-900">
            ADA Curb Ramp Alerts
          </h3>
          <p className="mt-1 text-2xl font-bold text-orange-700">{count}</p>
          <p className="mt-1 text-xs text-orange-600">
            {pct}% of segments flagged ({count} of {total})
          </p>
        </div>
      </div>
    </div>
  );
}
