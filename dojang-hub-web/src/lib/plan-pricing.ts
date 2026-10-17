/**
 * Salinan aturan paket dari dojang-hub-api/config/skaihub.php.
 * Server tetap sumber kebenaran (harga dihitung ulang saat langganan dibuat);
 * nilai di sini wajib disamakan bila config berubah.
 */
export type PlanKey = "starter" | "pro" | "scale";

export type DurationKey = "trial" | "monthly" | "quarterly" | "semester" | "yearly" | "custom";

export type PlanRule = {
  label: string;
  monthlyPrice: number;
  includedStudents: number;
  freeExtraBlocks: number;
};

export const PLAN_RULES: Record<PlanKey, PlanRule> = {
  starter: { label: "Starter", monthlyPrice: 99000, includedStudents: 50, freeExtraBlocks: 1 },
  pro: { label: "Pro", monthlyPrice: 199000, includedStudents: 150, freeExtraBlocks: 1 },
  scale: { label: "Scale", monthlyPrice: 349000, includedStudents: 300, freeExtraBlocks: 1 },
};

export const EXTRA_BLOCK_SIZE = 50;

export const EXTRA_BLOCK_SURCHARGE_PERCENT = 15;

const FIXED_DURATION_MONTHS: Record<Exclude<DurationKey, "custom">, number> = {
  trial: 0,
  monthly: 1,
  quarterly: 3,
  semester: 6,
  yearly: 12,
};

const AVERAGE_DAYS_PER_MONTH = 30.44;
const MS_PER_DAY = 86_400_000;

export type PriceBreakdown = {
  monthlyPrice: number;
  months: number;
  base: number;
  paidBlocks: number;
  surchargePercent: number;
  surcharge: number;
  total: number;
};

export function effectiveStudentLimit(plan: PlanKey, paidBlocks: number, includedStudents?: number): number {
  const rule = PLAN_RULES[plan];
  const included = includedStudents ?? rule.includedStudents;

  return included + (rule.freeExtraBlocks + paidBlocks) * EXTRA_BLOCK_SIZE;
}

export function priceBreakdown(plan: PlanKey, months: number, paidBlocks: number): PriceBreakdown {
  const monthlyPrice = PLAN_RULES[plan].monthlyPrice;
  const base = monthlyPrice * months;
  const total = Math.round((base * (100 + EXTRA_BLOCK_SURCHARGE_PERCENT * paidBlocks)) / 100);

  return {
    monthlyPrice,
    months,
    base,
    paidBlocks,
    surchargePercent: EXTRA_BLOCK_SURCHARGE_PERCENT,
    surcharge: total - base,
    total,
  };
}

export function subscriptionSubtotal(plan: PlanKey, months: number, paidBlocks: number): number {
  return priceBreakdown(plan, months, paidBlocks).total;
}

/** Durasi custom dibulatkan ke bulan terdekat (minimal 1), sama seperti server. */
export function durationMonths(duration: DurationKey, startsAt?: string, endsAt?: string): number {
  if (duration !== "custom") {
    return FIXED_DURATION_MONTHS[duration];
  }

  const start = startsAt ? Date.parse(startsAt) : Number.NaN;
  const end = endsAt ? Date.parse(endsAt) : Number.NaN;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 1;
  }

  const days = (end - start) / MS_PER_DAY + 1;

  return Math.max(1, Math.round(days / AVERAGE_DAYS_PER_MONTH));
}

export function formatPlanPrice(plan: PlanKey): string {
  return `Rp ${PLAN_RULES[plan].monthlyPrice.toLocaleString("id-ID")}`;
}

/** Ringkasan aturan kuota untuk halaman /harga. */
export function quotaNote(): string {
  const limit = (plan: PlanKey) => effectiveStudentLimit(plan, 0);

  return (
    `Starter hingga ${limit("starter")} siswa, Pro hingga ${limit("pro")}, Scale hingga ${limit("scale")} tanpa biaya tambahan; ` +
    `setiap tambahan ${EXTRA_BLOCK_SIZE} siswa +${EXTRA_BLOCK_SURCHARGE_PERCENT}% harga paket per bulan.`
  );
}
