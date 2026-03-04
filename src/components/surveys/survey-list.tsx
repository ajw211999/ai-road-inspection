"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Video } from "lucide-react";
import { UploadDialog } from "./upload-dialog";
import { SurveyCard } from "./survey-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Survey } from "@/types";

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch("/api/surveys");
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch {
      // Silently fail — list will just stay empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Auto-refresh when any survey is in uploading/processing state
  useEffect(() => {
    const hasActive = surveys.some(
      (s) => s.status === "uploading" || s.status === "processing"
    );
    if (!hasActive) return;

    const interval = setInterval(fetchSurveys, 5000);
    return () => clearInterval(interval);
  }, [surveys, fetchSurveys]);

  const handleUploadComplete = () => {
    fetchSurveys();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload dashcam video and track processing progress
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Survey
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={Video}
            title="No surveys yet"
            description="Upload a dashcam video to get started with your first road inspection survey."
            actionLabel="Upload Video"
            onAction={() => setDialogOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} />
          ))}
        </div>
      )}

      <UploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onComplete={handleUploadComplete}
      />
    </>
  );
}
