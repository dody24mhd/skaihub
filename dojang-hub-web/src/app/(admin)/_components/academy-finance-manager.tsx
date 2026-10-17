"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SppBill,
  TrainingClass,
  downloadAkademiSppExport,
  getAkademiClasses,
  getAkademiMe,
  getAkademiSppBills,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const monthLabels = [
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

async function fetchFinanceData(
  activeToken: string,
  filters: { year: number; month: number; statusFilter: string },
) {
  const [profileData, billData, classData] = await Promise.all([
    getAkademiMe(activeToken),
    getAkademiSppBills(activeToken, {
      year: filters.year,
      month: filters.month,
      status: filters.statusFilter,
    }),
    getAkademiClasses(activeToken),
  ]);

  return { profileData, billData, classData };
}

export default function AcademyFinanceManager() {
  const tokenRef = useRef("");
  const now = new Date();
  const [items, setItems] = useState<SppBill[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [isKetua, setIsKetua] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visibleItems = useMemo(() => {
    if (classFilter === "all") return items;
    return items.filter((item) => String(item.class_id || item.student?.primary_class_id || "") === classFilter);
  }, [classFilter, items]);

  const summary = useMemo(() => {
    return visibleItems.reduce(
      (total, item) => {
        total.bill += Number(item.amount);
        total.paid += Number(item.paid_amount);
        if (item.status === "unpaid" || item.status === "partial") total.unpaidCount++;
        if (item.status === "paid") total.paidCount++;
        if (item.status === "waived") total.waivedCount++;
        return total;
      },
      { bill: 0, paid: 0, paidCount: 0, unpaidCount: 0, waivedCount: 0 },
    );
  }, [visibleItems]);

  const remaining = Math.max(summary.bill - summary.paid, 0);

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      fetchFinanceData(activeToken, { year, month, statusFilter })
        .then(({ profileData, billData, classData }) => {
          const allowed = profileData.user.role === "ketua_akademi";
          setIsKetua(allowed);
          setItems(allowed ? billData.data.data : []);
          setClasses(classData.data);
        })
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat laporan keuangan."))
        .finally(() => setIsLoading(false));
    });
  }, [month, statusFilter, year]);

  async function handleExport() {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await downloadAkademiSppExport(tokenRef.current, {
        year,
        month,
        status: statusFilter,
        class_id: classFilter === "all" ? "all" : Number(classFilter),
      });
      setMessage("Export laporan keuangan diproses.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal export laporan keuangan.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat laporan keuangan...</p>;

  if (!isKetua) {
    return (
      <p className="rounded-md border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">
        Akses keuangan hanya tersedia untuk Ketua Akademi.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Total Tagihan</p>
          <p className="mt-2 text-2xl font-black text-primary">{money(summary.bill)}</p>
          <p className="text-sm text-muted">{visibleItems.length} tagihan</p>
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

      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Laporan Keuangan</p>
            <h2 className="font-heading text-xl font-bold text-primary">Rekap SPP</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            <input className="h-10 rounded-md border border-border px-3 text-sm" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {monthLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Semua status</option>
              <option value="unpaid">Belum lunas</option>
              <option value="partial">Sebagian</option>
              <option value="paid">Lunas</option>
              <option value="waived">Dibebaskan</option>
            </select>
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">Semua kelas</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="h-10 rounded-md border border-border px-3 text-sm font-bold text-primary" onClick={handleExport} type="button" disabled={isSaving}>Export</button>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Siswa</th>
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Tagihan</th>
                <th className="pb-3">Terbayar</th>
                <th className="pb-3">Sisa</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">
                    {item.student?.name || "-"}
                    <span className="block text-xs font-medium text-muted">{monthLabels[item.billing_month - 1]} {item.billing_year}</span>
                  </td>
                  <td className="py-3 text-muted">{item.class?.name || item.student?.primary_class?.name || "-"}</td>
                  <td className="py-3 text-muted">{money(item.amount)}</td>
                  <td className="py-3 text-success">{money(item.paid_amount)}</td>
                  <td className="py-3 text-secondary">{money(Math.max(Number(item.amount) - Number(item.paid_amount), 0))}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "paid" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {!visibleItems.length ? (
                <tr>
                  <td className="py-8 text-sm text-muted" colSpan={6}>Belum ada data SPP pada filter ini.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
