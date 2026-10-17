import { EvaluationPeriod } from "../../_lib/admin-api";

export const statusLabels: Record<EvaluationPeriod["status"], string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Arsip",
};

export const statusStyles: Record<EvaluationPeriod["status"], string> = {
  draft: "bg-surface-container text-muted",
  active: "bg-success/10 text-success",
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

/**
 * Mengubah nilai skor angka 1-100 ke label predikat
 * (Kurang / Cukup / Baik / Sangat Baik).
 */
export function getScoreLabel(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score) || score <= 0) {
    return "-";
  }
  if (score >= 85) return "Sangat Baik";
  if (score >= 70) return "Baik";
  if (score >= 60) return "Cukup";
  return "Kurang";
}

/**
 * Menghasilkan class CSS Tailwind untuk badge/label predikat nilai.
 */
export function getScoreLabelStyle(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score) || score <= 0) {
    return "text-muted";
  }
  if (score >= 85) return "text-success font-bold";
  if (score >= 70) return "text-primary font-bold";
  if (score >= 60) return "text-secondary font-bold";
  return "text-secondary-dark font-bold";
}
