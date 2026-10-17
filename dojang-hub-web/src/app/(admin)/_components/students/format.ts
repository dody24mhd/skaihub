export function money(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function shortDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export function physicalSummary(student: { height_cm: number | null; weight_kg: string | number | null }) {
  const height = student.height_cm ? `${student.height_cm} cm` : "-";
  const weight = student.weight_kg ? `${Number(student.weight_kg)} kg` : "-";

  return `${height} / ${weight}`;
}
