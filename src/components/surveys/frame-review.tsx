"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Check,
  X,
  Eye,
  Filter,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PciBadge, SeverityBadge } from "@/components/ui/badge";
import { distressLabel } from "@/lib/utils";
import type { Frame } from "@/types";

type FilterType = "all" | "flagged" | "overridden" | "low-confidence";

interface FrameReviewProps {
  surveyId: string;
}

export function FrameReview({ surveyId }: FrameReviewProps) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);

  const fetchFrames = useCallback(async () => {
    setLoading(true);
    try {
      const filterParam = filter !== "all" ? `&filter=${filter}` : "";
      const res = await fetch(
        `/api/surveys/${surveyId}/frames?page=${page}&pageSize=20${filterParam}`
      );
      if (!res.ok) throw new Error("Failed to fetch frames");
      const data = await res.json();
      setFrames(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch frames:", err);
    } finally {
      setLoading(false);
    }
  }, [surveyId, page, filter]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handleFrameUpdated = (updated: Frame) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    if (selectedFrame?.id === updated.id) {
      setSelectedFrame(updated);
    }
  };

  const filterOptions: { value: FilterType; label: string; count?: number }[] = [
    { value: "all", label: "All Frames" },
    { value: "flagged", label: "Flagged" },
    { value: "overridden", label: "Overridden" },
    { value: "low-confidence", label: "Low Confidence" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/surveys"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Frame Review</h1>
            <p className="text-sm text-gray-500">{total} frames total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : frames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Eye className="h-12 w-12" />
          <p className="mt-3 text-sm font-medium">No frames match this filter</p>
        </div>
      ) : (
        <>
          {/* Frame grid + detail panel */}
          <div className="flex gap-6">
            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {frames.map((frame) => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    isSelected={selectedFrame?.id === frame.id}
                    onClick={() => setSelectedFrame(frame)}
                  />
                ))}
              </div>
            </div>

            {/* Detail panel */}
            {selectedFrame && (
              <FrameDetailPanel
                frame={selectedFrame}
                onClose={() => setSelectedFrame(null)}
                onUpdated={handleFrameUpdated}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Frame Card (grid item)
// ============================================================

function FrameCard({
  frame,
  isSelected,
  onClick,
}: {
  frame: Frame;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Frame image */}
      <div className="aspect-video w-full bg-gray-100">
        <img
          src={frame.imageUrl}
          alt={`Frame ${frame.frameIndex}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Overlay badges */}
      <div className="absolute left-2 top-2 flex gap-1">
        {frame.flaggedForReview && (
          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            FLAGGED
          </span>
        )}
        {frame.humanOverride && (
          <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            OVERRIDE
          </span>
        )}
      </div>

      {/* Info bar */}
      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            #{frame.frameIndex}
          </span>
          <PciBadge score={frame.humanOverride ? (frame.humanPciScore ?? frame.pciScore) : frame.pciScore} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {distressLabel(frame.distressType)}
          </span>
          <SeverityBadge severity={frame.severity} />
        </div>
        {frame.confidence > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Confidence: {(frame.confidence * 100).toFixed(0)}%</span>
            {frame.confidence < 0.7 && (
              <AlertTriangle className="h-3 w-3 text-amber-400" />
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Frame Detail Panel (side panel)
// ============================================================

function FrameDetailPanel({
  frame,
  onClose,
  onUpdated,
}: {
  frame: Frame;
  onClose: () => void;
  onUpdated: (frame: Frame) => void;
}) {
  const [pciScore, setPciScore] = useState<string>(
    frame.humanPciScore?.toString() ?? ""
  );
  const [notes, setNotes] = useState(frame.humanNotes ?? "");
  const [saving, setSaving] = useState(false);

  // Reset form when frame changes
  useEffect(() => {
    setPciScore(frame.humanPciScore?.toString() ?? "");
    setNotes(frame.humanNotes ?? "");
  }, [frame.id, frame.humanPciScore, frame.humanNotes]);

  const handleSaveOverride = async () => {
    const score = parseInt(pciScore);
    if (isNaN(score) || score < 0 || score > 100) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/frames/${frame.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humanPciScore: score,
          humanNotes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      onUpdated(updated);
    } catch (err) {
      console.error("Failed to save override:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearOverride = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/frames/${frame.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humanOverride: false }),
      });
      if (!res.ok) throw new Error("Failed to clear");
      const updated = await res.json();
      onUpdated(updated);
    } catch (err) {
      console.error("Failed to clear override:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFlag = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/frames/${frame.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaggedForReview: !frame.flaggedForReview }),
      });
      if (!res.ok) throw new Error("Failed to toggle flag");
      const updated = await res.json();
      onUpdated(updated);
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-96 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Frame #{frame.frameIndex}
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Image */}
      <div className="border-b border-gray-100">
        <img
          src={frame.imageUrl}
          alt={`Frame ${frame.frameIndex}`}
          className="w-full object-contain"
        />
      </div>

      <div className="space-y-4 p-4">
        {/* AI Analysis Results */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            AI Analysis
          </h4>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Distress Type</span>
              <span className="text-sm font-medium text-gray-900">
                {distressLabel(frame.distressType)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Severity</span>
              <SeverityBadge severity={frame.severity} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PCI Score</span>
              <PciBadge score={frame.pciScore} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confidence</span>
              <span
                className={`text-sm font-medium ${
                  frame.confidence >= 0.7
                    ? "text-green-600"
                    : frame.confidence >= 0.4
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {(frame.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Current Override (if exists) */}
        {frame.humanOverride && (
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">
                Human Override Active
              </span>
              <button
                onClick={handleClearOverride}
                disabled={saving}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-blue-600">PCI:</span>
              <PciBadge score={frame.humanPciScore ?? 0} />
            </div>
            {frame.humanNotes && (
              <p className="mt-1 text-xs text-blue-600">{frame.humanNotes}</p>
            )}
          </div>
        )}

        {/* Flag for Review */}
        <button
          onClick={handleToggleFlag}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            frame.flaggedForReview
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Flag className="h-4 w-4" />
          {frame.flaggedForReview ? "Unflag" : "Flag for Review"}
        </button>

        {/* Override Form */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Override PCI Score
          </h4>
          <div className="mt-2 space-y-3">
            <div>
              <label className="block text-xs text-gray-500">
                PCI Score (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pciScore}
                onChange={(e) => setPciScore(e.target.value)}
                placeholder={frame.pciScore.toString()}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe why you're overriding the AI score..."
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveOverride}
              disabled={saving || !pciScore || isNaN(parseInt(pciScore))}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
