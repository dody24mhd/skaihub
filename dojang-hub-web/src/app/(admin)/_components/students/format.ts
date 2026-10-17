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
