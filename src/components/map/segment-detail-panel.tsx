"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { RoadSegment, Frame } from "@/types";
import { pciColor, pciLabel, formatMiles } from "@/lib/utils";
import { FrameList } from "./frame-list";
import {
  ArrowLeft,
  Accessibility,
  Ruler,
  MapPin,
  Check,
  X,
  Loader2,
  Eye,
} from "lucide-react";

interface SegmentDetailPanelProps {
  segment: RoadSegment;
  frames: Frame[];
  onBack: () => void;
  onSegmentUpdated?: (segment: RoadSegment) => void;
}

export function SegmentDetailPanel({
  segment,
  frames,
  onBack,
  onSegmentUpdated,
}: SegmentDetailPanelProps) {
  const segmentFrames = frames.filter((f) => f.segmentId === segment.id);

  const [editing, setEditing] = useState(false);
  const [pciInput, setPciInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when segment changes
  useEffect(() => {
    setEditing(false);
    setPciInput(segment.humanPciScore?.toString() ?? "");
    setNotesInput(segment.humanNotes ?? "");
  }, [segment.id, segment.humanPciScore, segment.humanNotes]);

  const displayPci = segment.humanOverride
    ? (segment.humanPciScore ?? segment.pciScore)
    : segment.pciScore;

  const handleSaveOverride = async () => {
    const score = parseInt(pciInput);
    if (isNaN(score) || score < 0 || score > 100) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/segments/${segment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humanPciScore: score,
          humanNotes: notesInput || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      onSegmentUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save segment override:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearOverride = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/segments/${segment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humanOverride: false }),
      });
      if (!res.ok) throw new Error("Failed to clear");
      const updated = await res.json();
      onSegmentUpdated?.(updated);
    } catch (err) {
      console.error("Failed to clear override:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </button>
        <h2 className="text-base font-semibold text-[var(--color-primary)]">
          {segment.streetName}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">{segment.district}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* PCI Score */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: pciColor(displayPci) }}
          >
            {displayPci}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              PCI Score
              {segment.humanOverride && (
                <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  OVERRIDE
                </span>
              )}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: pciColor(displayPci) }}
            >
              {pciLabel(displayPci)}
            </p>
            {segment.humanOverride && (
              <p className="mt-0.5 text-xs text-gray-400">
                AI score: {segment.pciScore}
              </p>
            )}
          </div>
        </div>

        {/* Human Override Section */}
        {segment.humanOverride && !editing && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">
                Field Override Active
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPciInput(segment.humanPciScore?.toString() ?? "");
                    setNotesInput(segment.humanNotes ?? "");
                    setEditing(true);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleClearOverride}
                  disabled={saving}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Clear
                </button>
              </div>
            </div>
            {segment.humanNotes && (
              <p className="mt-1 text-xs text-blue-600">{segment.humanNotes}</p>
            )}
          </div>
        )}

        {/* Override Form */}
        {editing || !segment.humanOverride ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {segment.humanOverride ? "Edit Override" : "Override PCI Score"}
            </h4>
            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-xs text-gray-500">
                  PCI Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pciInput}
                  onChange={(e) => setPciInput(e.target.value)}
                  placeholder={segment.pciScore.toString()}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">
                  Notes (optional)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Field observation notes..."
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveOverride}
                  disabled={saving || !pciInput || isNaN(parseInt(pciInput))}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save Override
                </button>
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Metadata */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <Ruler className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Length</p>
              <p className="text-sm font-medium text-gray-900">
                {segment.lengthFt} ft ({formatMiles(segment.lengthFt)} mi)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Surface</p>
              <p className="text-sm font-medium capitalize text-gray-900">
                {segment.surfaceType}
              </p>
            </div>
          </div>
        </div>

        {/* ADA Alert */}
        {segment.adaCurbRampFlag && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
            <Accessibility className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">
              ADA curb ramp alert flagged
            </span>
          </div>
        )}

        {/* Review Frames link */}
        <Link
          href={`/surveys/${segment.surveyId}/review`}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          Review Frames in Detail
        </Link>

        {/* Frames */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Frames ({segmentFrames.length})
          </h3>
          <FrameList frames={segmentFrames} />
        </div>
      </div>
    </div>
  );
}
