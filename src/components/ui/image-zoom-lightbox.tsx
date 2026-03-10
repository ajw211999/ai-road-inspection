"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { PciBadge } from "@/components/ui/badge";
import { distressLabel } from "@/lib/utils";
import type { Frame } from "@/types";

interface ImageZoomLightboxProps {
  frame: Frame;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ImageZoomLightbox({ frame, onClose, onPrev, onNext }: ImageZoomLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom when frame changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [frame.id]);

  // Keyboard handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
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

      {/* Prev/Next arrows */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg bg-black/50 px-3 py-2 text-sm text-white">
        <PciBadge score={frame.humanOverride ? (frame.humanPciScore ?? frame.pciScore) : frame.pciScore} />
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
        Scroll to zoom &middot; Drag to pan &middot; Click to zoom in &middot; Arrow keys to navigate &middot; Esc to close
      </div>
    </div>
  );
}
