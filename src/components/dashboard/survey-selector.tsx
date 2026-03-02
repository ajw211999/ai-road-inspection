"use client";

import { useState } from "react";
import type { Survey } from "@/types";
import { ChevronDown } from "lucide-react";

interface SurveySelectorProps {
  surveys: Survey[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SurveySelector({
  surveys,
  selectedId,
  onSelect,
}: SurveySelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = surveys.find((s) => s.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>{selected?.name ?? "Select survey"}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-80 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {surveys.map((survey) => (
            <button
              key={survey.id}
              onClick={() => {
                onSelect(survey.id);
                setOpen(false);
              }}
              className="flex w-full flex-col px-4 py-2 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">
                {survey.name}
              </span>
              <span className="text-xs text-gray-500">
                {survey.totalSegments} segments · {survey.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
