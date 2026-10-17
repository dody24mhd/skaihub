// Kunci warna sama dengan SportRank::BELT_COLORS di API.
export type BeltColorOption = {
  value: string;
  label: string;
  bar: string;
  border: string;
};

export const BELT_COLOR_OPTIONS: BeltColorOption[] = [
  { value: "white", label: "Putih", bar: "bg-white", border: "border-slate-300" },
  { value: "yellow", label: "Kuning", bar: "bg-yellow-300", border: "border-yellow-500" },
  { value: "orange", label: "Oranye", bar: "bg-orange-500", border: "border-orange-700" },
  { value: "green", label: "Hijau", bar: "bg-emerald-500", border: "border-emerald-700" },
  { value: "blue", label: "Biru", bar: "bg-blue-600", border: "border-blue-800" },
  { value: "purple", label: "Ungu", bar: "bg-purple-600", border: "border-purple-800" },
  { value: "brown", label: "Coklat", bar: "bg-amber-800", border: "border-amber-950" },
  { value: "red", label: "Merah", bar: "bg-red-600", border: "border-red-800" },
  { value: "black", label: "Hitam", bar: "bg-neutral-950", border: "border-neutral-700" },
  { value: "red_black", label: "Merah-Hitam (Poom)", bar: "bg-red-600", border: "border-neutral-900" },
];

// Kode sabuk demo lama (sebelum ada belt_color) tetap dikenali.
const LEGACY_CODE_COLORS: Record<string, string> = {
  white: "white",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  red: "red",
  black: "black",
  poom: "red_black",
};

export function findBeltColor(value: string | null | undefined): BeltColorOption | undefined {
  return BELT_COLOR_OPTIONS.find((option) => option.value === value);
}

type BeltLike = {
  code: string;
  label: string;
  belt_color?: string | null;
};

export function resolveBeltColor(rank: BeltLike): BeltColorOption | undefined {
  const direct = findBeltColor(rank.belt_color) ?? findBeltColor(LEGACY_CODE_COLORS[rank.code?.toLowerCase()]);
  if (direct) return direct;

  const label = rank.label.toLowerCase();
  return BELT_COLOR_OPTIONS.find((option) => label.includes(option.label.toLowerCase()));
}
