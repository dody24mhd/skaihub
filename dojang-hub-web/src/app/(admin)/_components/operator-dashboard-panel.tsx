"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  OperatorDashboard,
  OperatorDashboardAttention,
  SubscriptionLifecycleState,
  getOperatorDashboard,
} from "../_lib/admin-api";
import { PLAN_RULES } from "@/lib/plan-pricing";

const STATE_META: Record<SubscriptionLifecycleState, { label: string; badge: string }> = {
  active: { label: "Aktif", badge: "bg-success/10 text-success-strong" },
  expiring: { label: "Akan habis", badge: "bg-belt-yellow/25 text-primary" },
  grace: { label: "Masa tenggang", badge: "bg-caution/10 text-caution" },
  read_only: { label: "Baca-saja", badge: "bg-secondary/10 text-secondary" },
};

const STATE_ORDER: SubscriptionLifecycleState[] = ["active", "expiring", "grace", "read_only"];

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function attentionDetail(item: OperatorDashboardAttention): string {
  if (item.state === "expiring") return `${item.days_left} hari lagi`;
  if (item.state === "grace") return `Tenggang ${item.days_left} hari lagi`;
  return "Tidak bisa mengubah data";
}

type OperatorDashboardPanelProps = {
  token: string;
};

export default function OperatorDashboardPanel({ token }: OperatorDashboardPanelProps) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    setError("");
    getOperatorDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setError(`Gagal memuat ringkasan operator: ${err.message}`))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  if (error) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-secondary/30 bg-secondary/5 p-5 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm font-semibold text-secondary">{error}</p>
        <button
          type="button"
          onClick={load}
          className="min-h-11 rounded-md border border-secondary px-4 text-sm font-bold text-secondary"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  if (isLoading || !dashboard) {
    return <p className="rounded-lg bg-white p-5 text-sm text-muted">Memuat ringkasan operator...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <article className="card-soft col-span-2 rounded-lg bg-white p-4 lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">MRR</p>
          <p className="mt-1 font-heading text-2xl font-black text-success-strong">{formatCurrency(dashboard.mrr)}</p>
          <p className="text-[11px] text-muted">Perkiraan pendapatan bulanan langganan aktif</p>
        </article>
        {STATE_ORDER.map((state) => (
          <article key={state} className="card-soft rounded-lg bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{STATE_META[state].label}</p>
            <p data-testid={`state-count-${state}`} className="mt-1 font-heading text-2xl font-black text-primary">
              {dashboard.state_counts[state]}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AttentionList items={dashboard.attention} />
        <NearQuotaList items={dashboard.near_quota} />
      </div>
    </div>
  );
}

function AttentionList({ items }: { items: OperatorDashboardAttention[] }) {
  return (
    <section className="card-soft rounded-lg bg-white p-5">
      <h2 className="font-heading text-base font-bold text-primary">Perlu ditindaklanjuti</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Semua langganan akademi aman.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <li key={item.akademi_id} className="flex flex-wrap items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-primary">{item.akademi_name}</p>
                <p className="text-xs text-muted">
                  Paket {PLAN_RULES[item.plan].label} · {attentionDetail(item)}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${STATE_META[item.state].badge}`}>
                {STATE_META[item.state].label}
              </span>
              <Link
                href="/internal/subscription"
                className="inline-flex min-h-11 items-center rounded-md bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/20"
              >
                Catat perpanjangan
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NearQuotaList({ items }: { items: OperatorDashboard["near_quota"] }) {
  return (
    <section className="card-soft rounded-lg bg-white p-5">
      <h2 className="font-heading text-base font-bold text-primary">Mendekati kuota siswa</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Belum ada akademi yang mendekati kuota.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <li key={item.akademi_id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-bold text-primary">{item.akademi_name}</p>
                <span className="text-xs font-semibold text-muted">Paket {PLAN_RULES[item.plan].label}</span>
              </div>
              <p className="text-xs text-muted">
                {`${item.active_students} / ${item.student_limit} siswa (${item.usage_percent}%)`}
              </p>
              <div className="mt-2 h-2 w-full bg-surface-container" aria-hidden="true">
                <div
                  className={item.usage_percent >= 100 ? "h-2 bg-secondary" : "h-2 bg-caution"}
                  style={{ width: `${Math.min(item.usage_percent, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
