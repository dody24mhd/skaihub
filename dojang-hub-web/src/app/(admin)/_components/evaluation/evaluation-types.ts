import { EvaluationPeriod } from "../../_lib/admin-api";

export const statusLabels: Record<EvaluationPeriod["status"], string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Arsip",
};

export const statusStyles: Record<EvaluationPeriod["status"], string> = {
  draft: "bg-surface-container text-muted",
  active: "bg-success/10 text-success-strong",
  closed: "bg-primary/10 text-primary",
};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

export function shortDate(value: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// Rentang predikat belum ditetapkan di PRD/SCHEMA; batas ini keputusan UI (lihat laporan L3-D).
// Must mirror EvaluationController::indicatorForScore in dojang-hub-api.
export const SCORE_BANDS = [
  { label: "Kurang", min: 1, max: 59, style: "text-secondary-dark font-bold" },
  { label: "Cukup", min: 60, max: 74, style: "text-secondary font-bold" },
  { label: "Baik", min: 75, max: 89, style: "text-primary font-bold" },
  { label: "Sangat Baik", min: 90, max: 100, style: "text-success-strong font-bold" },
] as const;

function findScoreBand(score: number | null | undefined) {
  if (score === null || score === undefined || isNaN(score) || score <= 0) return null;
  return [...SCORE_BANDS].reverse().find((band) => score >= band.min) ?? null;
}

export function getScoreLabel(score: number | null | undefined): string {
  return findScoreBand(score)?.label ?? "-";
}

export function getScoreLabelStyle(score: number | null | undefined): string {
  return findScoreBand(score)?.style ?? "text-muted";
}
