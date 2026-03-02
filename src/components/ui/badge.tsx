import { cn, pciColor, pciLabel } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        color ? "text-white" : "bg-gray-100 text-gray-700",
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {children}
    </span>
  );
}

export function PciBadge({
  score,
  showLabel = true,
  className,
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <Badge color={pciColor(score)} className={className}>
      {score}
      {showLabel && <span className="ml-1">{pciLabel(score)}</span>}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: "low" | "medium" | "high";
  className?: string;
}) {
  const colors = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        colors[severity],
        className
      )}
    >
      {severity}
    </span>
  );
}
