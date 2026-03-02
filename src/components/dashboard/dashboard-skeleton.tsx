import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />

      {/* Metrics cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white">
        <Skeleton className="m-6 h-5 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mx-6 mb-3 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
