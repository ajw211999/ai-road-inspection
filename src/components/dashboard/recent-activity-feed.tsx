"use client";

import { CheckCircle, Flag, Upload, Loader2, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string | null;
}

interface RecentActivityFeedProps {
  activity: ActivityItem[];
}

function getIcon(type: string) {
  switch (type) {
    case "override":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "flag":
      return <Flag className="h-4 w-4 text-amber-500" />;
    case "survey_completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "survey_processing":
      return <Loader2 className="h-4 w-4 text-blue-400" />;
    default:
      return <Upload className="h-4 w-4 text-gray-400" />;
  }
}

function getLabel(type: string) {
  switch (type) {
    case "override":
      return "Human Override";
    case "flag":
      return "Flagged";
    case "survey_completed":
      return "Survey Done";
    case "survey_processing":
      return "Processing";
    default:
      return "Upload";
  }
}

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-[var(--color-primary)]">
          Recent Activity
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Latest updates across your surveys
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {activity.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">
            <Clock className="mr-2 h-4 w-4" />
            No recent activity
          </div>
        ) : (
          activity.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500">
                    {getLabel(item.type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-700">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
