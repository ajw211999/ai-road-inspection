"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

type UploadStage = "idle" | "uploading" | "processing" | "complete" | "error";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function UploadDialog({ open, onClose, onComplete }: UploadDialogProps) {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setName("");
    setFile(null);
    setProgress(0);
    setBytesUploaded(0);
    setError(null);
    setSurveyId(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const handleClose = useCallback(() => {
    if (stage === "uploading") return; // Don't close during upload
    reset();
    onClose();
  }, [stage, reset, onClose]);

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return "Invalid file type. Please upload MP4, MOV, WebM, or AVI.";
    }
    return null;
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
    if (!name) {
      setName(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const pollStatus = (sid: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/surveys/${sid}/status`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed") {
          setStage("complete");
          if (pollRef.current) clearInterval(pollRef.current);
          onComplete();
        } else if (data.status === "failed") {
          setStage("error");
          setError("Frame extraction failed. Please try again.");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Polling error — keep trying
      }
    }, 2000);
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;

    setStage("uploading");
    setError(null);
    setProgress(0);
    setBytesUploaded(0);

    try {
      // 1. Init upload
      const initRes = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contentType: file.type }),
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || "Failed to initialize upload");
      }

      const { uploadId, surveyId: sid } = await initRes.json();
      setSurveyId(sid);

      // 2. Upload chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const chunkRes = await fetch(`/api/uploads/${uploadId}/chunk`, {
          method: "POST",
          headers: { "x-chunk-index": String(i) },
          body: chunk,
        });

        if (!chunkRes.ok) {
          throw new Error(`Chunk ${i} upload failed`);
        }

        setBytesUploaded(end);
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      // 3. Complete upload
      const completeRes = await fetch(`/api/uploads/${uploadId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId: sid }),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.error || "Failed to complete upload");
      }

      // 4. Switch to processing stage and start polling
      setStage("processing");
      pollStatus(sid);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (!open) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            New Survey Upload
          </h2>
          <button
            onClick={handleClose}
            disabled={stage === "uploading"}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4">
          {/* Survey name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Survey Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Downtown Inspection March 2026"
              disabled={stage !== "idle"}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Drop zone */}
          {stage === "idle" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : file
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <Film className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(file.size)}
                  </p>
                  <p className="text-xs text-green-600">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    Drag & drop your dashcam video
                  </p>
                  <p className="text-xs text-gray-500">
                    MP4, MOV, WebM, or AVI
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {stage === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {formatBytes(bytesUploaded)} / {file ? formatBytes(file.size) : ""}
              </p>
            </div>
          )}

          {/* Processing state */}
          {stage === "processing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="text-sm font-medium text-gray-900">
                Extracting frames...
              </p>
              <p className="text-xs text-gray-500">
                FFmpeg is processing your video at 1 frame per second.
                This may take a moment.
              </p>
            </div>
          )}

          {/* Complete state */}
          {stage === "complete" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-gray-900">
                Upload complete!
              </p>
              <p className="text-xs text-gray-500">
                Frames have been extracted and are ready for analysis.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          {stage === "idle" && (
            <>
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || !name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload
              </button>
            </>
          )}
          {(stage === "complete" || stage === "error") && (
            <button
              onClick={handleClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {stage === "complete" ? "Done" : "Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
