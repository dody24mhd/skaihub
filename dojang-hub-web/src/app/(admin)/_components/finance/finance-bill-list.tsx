"use client";

import { SppBill } from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";

export const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const statusLabels: Record<SppBill["status"], string> = {
  unpaid: "Belum lunas",
  partial: "Sebagian",
  paid: "Lunas",
  waived: "Dibebaskan",
};

function money(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const columns: ResponsiveColumn<SppBill>[] = [
  {
    key: "student",
    header: "Siswa",
    primary: true,
    render: (item) => (
      <div>
        <p className="font-bold text-primary">{item.student?.name || "-"}</p>
        <span className="block text-xs font-medium text-muted">
          {monthLabels[item.billing_month - 1]} {item.billing_year}
        </span>
      </div>
    ),
  },
  {
    key: "class",
    header: "Kelas",
    render: (item) => (
      <span className="text-muted">
        {item.class?.name || item.student?.primary_class?.name || "-"}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Tagihan",
    render: (item) => <span className="font-semibold text-primary">{money(item.amount)}</span>,
  },
  {
    key: "paid",
    header: "Terbayar",
    render: (item) => (
      <span className="font-semibold text-success">{money(item.paid_amount)}</span>
    ),
  },
  {
    key: "remaining",
    header: "Sisa",
    render: (item) => (
      <span className="font-semibold text-secondary">
        {money(Math.max(Number(item.amount) - Number(item.paid_amount), 0))}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
          item.status === "paid" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"
        }`}
      >
        {statusLabels[item.status]}
      </span>
    ),
  },
];

export function FinanceBillList({ rows }: { rows: SppBill[] }) {
  return (
    <ResponsiveList
      columns={columns}
      rows={rows}
      getRowKey={(item) => item.id}
      ariaLabel="Rekap Laporan SPP"
      emptyState={
        <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
          Belum ada data SPP pada filter ini.
        </div>
      }
    />
  );
}

export type FinanceSummary = {
  bill: number;
  paid: number;
  paidCount: number;
  unpaidCount: number;
  waivedCount: number;
};

type FinanceSummaryCardsProps = {
  summary: FinanceSummary;
  billCount: number;
};

export function FinanceSummaryCards({ summary, billCount }: FinanceSummaryCardsProps) {
  const remaining = Math.max(summary.bill - summary.paid, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Total Tagihan</p>
        <p className="mt-2 text-2xl font-black text-primary">{money(summary.bill)}</p>
        <p className="text-sm text-muted">{billCount} tagihan</p>
      </article>
      <article className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Terbayar</p>
        <p className="mt-2 text-2xl font-black text-success">{money(summary.paid)}</p>
        <p className="text-sm text-muted">{summary.paidCount} lunas</p>
      </article>
      <article className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Sisa Tagihan</p>
        <p className="mt-2 text-2xl font-black text-secondary">{money(remaining)}</p>
        <p className="text-sm text-muted">{summary.unpaidCount} belum selesai</p>
      </article>
      <article className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Dibebaskan</p>
        <p className="mt-2 text-2xl font-black text-primary">{summary.waivedCount}</p>
        <p className="text-sm text-muted">tagihan tanpa pembayaran</p>
      </article>
    </div>
  );
}
