import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-gray-100">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="w-80 border-l border-gray-200 bg-white p-4 md:w-96">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-9 w-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
