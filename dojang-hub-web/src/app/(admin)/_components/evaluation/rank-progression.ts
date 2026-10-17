import { SportRank } from "../../_lib/admin-api";

// Usia minimal ujian Dan Kukkiwon; di bawahnya siswa mengambil Poom (docs/RANK-SYSTEMS.md).
const DAN_MIN_AGE = 15;

type RankLike = Pick<SportRank, "sequence"> | null | undefined;

function bySequence(a: SportRank, b: SportRank): number {
  return a.sequence - b.sequence;
}

export function higherRanks(ranks: SportRank[], current: RankLike): SportRank[] {
  const floor = current?.sequence ?? Number.NEGATIVE_INFINITY;
  return ranks.filter((rank) => rank.sequence > floor).sort(bySequence);
}

export function defaultNextRank(ranks: SportRank[], current: RankLike, age: number | null): SportRank | null {
  const candidates = higherRanks(ranks, current);
  if (candidates.length === 0) return null;

  const sameStep = candidates.filter((rank) => rank.sequence === candidates[0].sequence);
  const preferred = age !== null && age < DAN_MIN_AGE ? "poom" : "dan";
  return sameStep.find((rank) => rank.level_type === preferred) ?? sameStep[0];
}

// Sama dengan aturan API: jumlah nilai sequence berbeda di antara sabuk asal dan tujuan.
export function skippedSteps(ranks: SportRank[], current: RankLike, target: RankLike): number {
  if (!current || !target) return 0;

  const between = ranks
    .map((rank) => rank.sequence)
    .filter((sequence) => sequence > current.sequence && sequence < target.sequence);
  return new Set(between).size;
}

export function ageOn(birthDate: string | null | undefined, today: Date = new Date()): number | null {
  if (!birthDate) return null;

  const [year, month, day] = birthDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;

  const todayMonth = today.getMonth() + 1;
  const hadBirthday = todayMonth > month || (todayMonth === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}
