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
import { FinanceBillList, FinanceSummaryCards, monthLabels } from "./finance/finance-bill-list";

const TOKEN_KEY = "skaihub_admin_token";

async function fetchFinanceData(
  activeToken: string,
  filters: { year: number; month: number; statusFilter: string }
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
    return items.filter(
      (item) =>
        String(item.class_id || item.student?.primary_class_id || "") === classFilter
    );
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
      { bill: 0, paid: 0, paidCount: 0, unpaidCount: 0, waivedCount: 0 }
    );
  }, [visibleItems]);

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
        .catch((caught) =>
          setError(
            caught instanceof Error ? caught.message : "Gagal memuat laporan keuangan."
          )
        )
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
      setError(
        caught instanceof Error ? caught.message : "Gagal export laporan keuangan."
      );
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
      <FinanceSummaryCards summary={summary} billCount={visibleItems.length} />

      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Laporan Keuangan</p>
            <h2 className="font-heading text-xl font-bold text-primary">Rekap SPP</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <input
              className="min-h-11 rounded-md border border-border bg-white px-3 text-base text-primary sm:text-sm"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              aria-label="Tahun"
            />
            <select
              className="min-h-11 rounded-md border border-border bg-white px-3 text-base text-primary sm:text-sm"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              aria-label="Bulan"
            >
              {monthLabels.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="min-h-11 rounded-md border border-border bg-white px-3 text-base text-primary sm:text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Status Tagihan"
            >
              <option value="all">Semua status</option>
              <option value="unpaid">Belum lunas</option>
              <option value="partial">Sebagian</option>
              <option value="paid">Lunas</option>
              <option value="waived">Dibebaskan</option>
            </select>
            <select
              className="min-h-11 rounded-md border border-border bg-white px-3 text-base text-primary sm:text-sm"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              aria-label="Filter Kelas"
            >
              <option value="all">Semua kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary transition hover:bg-surface-container sm:col-span-1"
              onClick={handleExport}
              type="button"
              disabled={isSaving}
            >
              Export
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <FinanceBillList rows={visibleItems} />
        </div>
      </section>
    </section>
  );
}
