// Nilai sama dengan App\Enums\RankSystem di API. Katalog & sumber: docs/RANK-SYSTEMS.md.
export type RankSystem = "taekwondo_kukkiwon" | "karate_forki" | "karate_kki";

export type RankSystemOption = {
  value: RankSystem;
  label: string;
  shortLabel: string;
  sportType: string;
};

export const RANK_SYSTEM_OPTIONS: RankSystemOption[] = [
  { value: "taekwondo_kukkiwon", label: "Taekwondo Kukkiwon", shortLabel: "Kukkiwon", sportType: "taekwondo" },
  { value: "karate_forki", label: "Karate FORKI", shortLabel: "FORKI", sportType: "karate" },
  { value: "karate_kki", label: "Karate KKI", shortLabel: "KKI", sportType: "karate" },
];

export function rankSystemsForSport(sportType: string): RankSystemOption[] {
  return RANK_SYSTEM_OPTIONS.filter((option) => option.sportType === sportType);
}

export function defaultRankSystemForSport(sportType: string): RankSystem | null {
  return rankSystemsForSport(sportType)[0]?.value ?? null;
}

function findOption(value: string | null | undefined): RankSystemOption | undefined {
  return RANK_SYSTEM_OPTIONS.find((option) => option.value === value);
}

export function rankSystemLabel(value: string | null | undefined): string {
  return findOption(value)?.label ?? "Tanpa sistem bawaan";
}

export function builtinRankLabel(value: string | null | undefined): string {
  const option = findOption(value);
  return option ? `Bawaan ${option.shortLabel}` : "Bawaan";
}
