import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  color,
  subtitle,
  icon: Icon,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-lg border border-gray-200 bg-white p-5", className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <p
        className="mt-2 text-3xl font-bold"
        style={{ color: color ?? "var(--color-primary)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
