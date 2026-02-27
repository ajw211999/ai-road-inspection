import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Color for PCI score ranges */
export function pciColor(score: number): string {
  if (score >= 85) return "#22c55e"; // green — Good
  if (score >= 70) return "#84cc16"; // lime — Satisfactory
  if (score >= 55) return "#eab308"; // yellow — Fair
  if (score >= 40) return "#f97316"; // orange — Poor
  return "#ef4444"; // red — Very Poor / Failed
}

/** Label for PCI score ranges */
export function pciLabel(score: number): string {
  if (score >= 85) return "Good";
  if (score >= 70) return "Satisfactory";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Poor";
  return "Failed";
}
