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
  ZoomIn,
  CheckSquare,
  Square,
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
  const [zoomedFrame, setZoomedFrame] = useState<Frame | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkPciScore, setBulkPciScore] = useState<string>("");

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

  // Reset page and selection when filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filter]);

  // Clear selection on page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const handleFrameUpdated = (updated: Frame) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    if (selectedFrame?.id === updated.id) {
      setSelectedFrame(updated);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === frames.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(frames.map((f) => f.id)));
    }
  };

  const handleBulkApprove = async (pciScore?: number) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/frames/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameIds: Array.from(selectedIds),
          action: "approve",
          humanPciScore: pciScore,
          humanNotes: "Bulk approved — looks fine",
        }),
      });
      if (!res.ok) throw new Error("Bulk approve failed");
      await fetchFrames();
      setSelectedIds(new Set());
      setBulkPciScore("");
    } catch (err) {
      console.error("Bulk approve error:", err);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkFlag = async (flag: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/frames/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameIds: Array.from(selectedIds),
          action: flag ? "flag" : "unflag",
        }),
      });
      if (!res.ok) throw new Error("Bulk flag failed");
      await fetchFrames();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk flag error:", err);
    } finally {
      setBulkSaving(false);
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
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

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} frame{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* PCI score input + apply override */}
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-gray-200">
              <input
                type="number"
                min="0"
                max="100"
                value={bulkPciScore}
                onChange={(e) => setBulkPciScore(e.target.value)}
                placeholder="PCI"
                className="w-16 border-none bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button
                onClick={() => {
                  const score = parseInt(bulkPciScore);
                  if (isNaN(score) || score < 0 || score > 100) return;
                  handleBulkApprove(score);
                }}
                disabled={bulkSaving || !bulkPciScore || isNaN(parseInt(bulkPciScore))}
                className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {bulkSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Apply Override
              </button>
            </div>
            <span className="text-xs text-gray-400">or</span>
            <button
              onClick={() => handleBulkApprove()}
              disabled={bulkSaving}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {bulkSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve (Keep AI Score)
            </button>
            <button
              onClick={() => handleBulkFlag(true)}
              disabled={bulkSaving}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <Flag className="h-3.5 w-3.5" />
              Flag Selected
            </button>
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setBulkPciScore("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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
          {/* Select all toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              {selectedIds.size === frames.length ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.size === frames.length ? "Deselect all" : "Select all on page"}
            </button>
          </div>

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
                    isChecked={selectedIds.has(frame.id)}
                    onCheck={() => toggleSelect(frame.id)}
                    onClick={() => setSelectedFrame(frame)}
                    onZoom={() => setZoomedFrame(frame)}
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
                onZoom={() => setZoomedFrame(selectedFrame)}
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

      {/* Zoom lightbox */}
      {zoomedFrame && (
        <ImageZoomLightbox
          frame={zoomedFrame}
          onClose={() => setZoomedFrame(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Frame Card (grid item) — now with checkbox + zoom button
// ============================================================

function FrameCard({
  frame,
  isSelected,
  isChecked,
  onCheck,
  onClick,
  onZoom,
}: {
  frame: Frame;
  isSelected: boolean;
  isChecked: boolean;
  onCheck: () => void;
  onClick: () => void;
  onZoom: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : isChecked
            ? "border-blue-400 ring-1 ring-blue-100"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCheck();
        }}
        className="absolute left-2 top-2 z-10 rounded bg-white/80 p-0.5 backdrop-blur-sm hover:bg-white"
      >
        {isChecked ? (
          <CheckSquare className="h-5 w-5 text-blue-600" />
        ) : (
          <Square className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </button>

      {/* Zoom button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onZoom();
        }}
        className="absolute right-2 top-2 z-10 rounded bg-white/80 p-1 text-gray-500 opacity-0 backdrop-blur-sm transition-opacity hover:bg-white hover:text-gray-700 group-hover:opacity-100"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      {/* Clickable area for detail panel */}
      <button onClick={onClick} className="w-full text-left">
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
        <div className="absolute right-2 bottom-[calc(50%+0.5rem)] flex gap-1">
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
    </div>
  );
}

// ============================================================
// Image Zoom Lightbox
// ============================================================

function ImageZoomLightbox({
  frame,
  onClose,
}: {
  frame: Frame;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">
          Frame #{frame.frameIndex} &middot; {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(5, s + 0.5))}
          className="rounded bg-white/10 p-2 text-white hover:bg-white/20"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.5))}
          className="rounded bg-white/10 p-2 text-white hover:bg-white/20"
        >
          -
        </button>
        <button
          onClick={resetZoom}
          className="rounded bg-white/10 px-2 py-2 text-xs text-white hover:bg-white/20"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="rounded bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg bg-black/50 px-3 py-2 text-sm text-white">
        <PciBadge score={frame.pciScore} />
        <span>{distressLabel(frame.distressType)}</span>
        <span>Confidence: {(frame.confidence * 100).toFixed(0)}%</span>
      </div>

      {/* Image */}
      <div
        className="overflow-hidden"
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (scale === 1) setScale(2);
        }}
      >
        <img
          src={frame.imageUrl}
          alt={`Frame ${frame.frameIndex}`}
          className="max-h-[85vh] max-w-[90vw] select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.2s ease",
          }}
          draggable={false}
        />
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 right-4 text-xs text-white/50">
        Scroll to zoom &middot; Drag to pan &middot; Click to zoom in &middot; Esc to close
      </div>
    </div>
  );
}

// ============================================================
// Frame Detail Panel (side panel) — now with zoom button
// ============================================================

function FrameDetailPanel({
  frame,
  onClose,
  onUpdated,
  onZoom,
}: {
  frame: Frame;
  onClose: () => void;
  onUpdated: (frame: Frame) => void;
  onZoom: () => void;
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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="w-96 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Frame #{frame.frameIndex}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onZoom}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Zoom image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image — click to zoom */}
      <div
        className="cursor-zoom-in border-b border-gray-100"
        onClick={onZoom}
      >
        <img
          src={frame.imageUrl}
          alt={`Frame ${frame.frameIndex}`}
          className="w-full object-contain"
        />
        <div className="flex items-center justify-center gap-1 py-1 text-[10px] text-gray-400">
          <ZoomIn className="h-3 w-3" /> Click to zoom
        </div>
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
                PCI Score (0-100)
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
