"use client";

import {
  DurationKey,
  EXTRA_BLOCK_SIZE,
  PLAN_RULES,
  PlanKey,
  durationMonths,
  priceBreakdown,
} from "@/lib/plan-pricing";

type SubscriptionPricePreviewProps = {
  plan: PlanKey;
  duration: DurationKey;
  startsAt: string;
  endsAt: string;
  extraStudents: string;
  amount: string;
  onExtraStudentsChange: (value: string) => void;
  onAmountChange: (value: string) => void;
};

const inputCls =
  "h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary";

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function extraStudentsToBlocks(extraStudents: string): number {
  return Math.ceil(Math.max(0, Number(extraStudents || 0)) / EXTRA_BLOCK_SIZE);
}

export default function SubscriptionPricePreview({
  plan,
  duration,
  startsAt,
  endsAt,
  extraStudents,
  amount,
  onExtraStudentsChange,
  onAmountChange,
}: SubscriptionPricePreviewProps) {
  const rule = PLAN_RULES[plan];
  const paidBlocks = extraStudentsToBlocks(extraStudents);
  const freeStudents = rule.freeExtraBlocks * EXTRA_BLOCK_SIZE;
  const paidStudents = paidBlocks * EXTRA_BLOCK_SIZE;
  const months = durationMonths(duration, startsAt, endsAt);
  const price = priceBreakdown(plan, months, paidBlocks);
  const isManualDifferent = amount !== "" && Number(amount) !== price.total;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-3.5">
        <p className="label-caps mb-2 text-muted">Kuota siswa</p>
        <p className="flex items-baseline gap-2">
          <span data-testid="quota-total" className="text-2xl font-bold text-primary">
            {(rule.includedStudents + freeStudents + paidStudents).toLocaleString("id-ID")}
          </span>
          <span className="text-sm text-muted">siswa</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {`${rule.includedStudents} bawaan paket + ${freeStudents} bonus gratis${paidStudents > 0 ? ` + ${paidStudents} berbayar` : ""}`}
        </p>
        <div className="mt-3 space-y-1">
          <label htmlFor="extra-students" className="label-caps block text-muted">
            Siswa tambahan berbayar
          </label>
          <p className="text-xs text-muted/70">{`Kelipatan ${EXTRA_BLOCK_SIZE} · opsional`}</p>
          <input
            id="extra-students"
            type="number"
            min={0}
            step={EXTRA_BLOCK_SIZE}
            value={extraStudents}
            onChange={(e) => onExtraStudentsChange(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-3.5 text-sm">
        <p className="label-caps mb-2 text-muted">Rincian harga otomatis</p>
        <dl className="space-y-1">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{`Paket ${rule.label} ${formatCurrency(price.monthlyPrice)} × ${price.months} bulan`}</dt>
            <dd className="font-semibold text-primary">{formatCurrency(price.base)}</dd>
          </div>
          {paidBlocks > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{`${paidBlocks} blok berbayar × ${price.surchargePercent}% per bulan`}</dt>
              <dd className="font-semibold text-primary">{formatCurrency(price.surcharge)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-t border-border pt-1">
            <dt className="font-bold text-primary">Total</dt>
            <dd data-testid="price-total" className="font-bold text-primary">{formatCurrency(price.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-1">
        <label htmlFor="subscription-amount" className="label-caps block text-muted">
          Nominal tagihan (Rp)
        </label>
        <p className="text-xs text-muted/70">Kosongkan untuk memakai harga otomatis.</p>
        <input
          id="subscription-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder={String(price.total)}
          className={inputCls}
        />
        {isManualDifferent ? (
          <p className="text-xs font-semibold text-caution">
            Nominal berbeda dari harga otomatis. Isi catatan internal sebagai alasan.
          </p>
        ) : null}
      </div>
    </div>
  );
}
