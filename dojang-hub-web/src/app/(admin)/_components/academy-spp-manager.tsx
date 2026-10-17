"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  SppBill,
  SppSettings,
  TrainingClass,
  getAkademiClasses,
  getAkademiMe,
  getAkademiSppBills,
  getAkademiSppSettings,
} from "../_lib/admin-api";
import { buildSppBillColumns } from "./spp/spp-bill-columns";
import SppArrearsSection from "./spp/spp-arrears-section";
import SppClassBills from "./spp/spp-class-bills";
import SppClassSummaryList from "./spp/spp-class-summary-list";
import SppGenerateModal from "./spp/spp-generate-modal";
import SppPaymentModal from "./spp/spp-payment-modal";
import SppSettingsModal from "./spp/spp-settings-modal";
import SppWaiveModal from "./spp/spp-waive-modal";
import { SPP_MONTH_LABELS, billsForClass, summarizeBills } from "./spp/spp-summary";

const TOKEN_KEY = "skaihub_admin_token";
const DEFAULT_SPP_SETTINGS: SppSettings = { default_monthly_amount: null, due_day: 10 };
const OVERDUE_FILTER = "overdue";

type SppView = "bills" | "arrears";

const SPP_VIEWS: { value: SppView; label: string }[] = [
  { value: "bills", label: "Tagihan" },
  { value: "arrears", label: "Tunggakan" },
];

const filterClass =
  "min-h-11 w-full border border-border bg-white px-3 text-base text-primary outline-none focus:border-primary sm:text-sm";

async function fetchSppData(
  activeToken: string,
  filters: { year: number; month: number; statusFilter: string },
) {
  const [profileData, billData, classData] = await Promise.all([
    getAkademiMe(activeToken),
    getAkademiSppBills(activeToken, {
      year: filters.year,
      month: filters.month,
      status: filters.statusFilter === OVERDUE_FILTER ? "all" : filters.statusFilter,
      overdue: filters.statusFilter === OVERDUE_FILTER,
    }),
    getAkademiClasses(activeToken),
  ]);

  return { profileData, billData, classData };
}

function StatCard({ label, value, caption, tone }: { label: string; value: number; caption: string; tone: string }) {
  return (
    <article className="card-soft bg-white p-4 sm:p-5">
      <p className="label-caps text-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
      <p className="text-sm text-muted">{caption}</p>
    </article>
  );
}

export default function AcademySppManager() {
  const now = new Date();
  const [token, setToken] = useState("");
  const [items, setItems] = useState<SppBill[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [payTarget, setPayTarget] = useState<SppBill | null>(null);
  const [waiveTarget, setWaiveTarget] = useState<SppBill | null>(null);
  const [view, setView] = useState<SppView>("bills");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [settings, setSettings] = useState<SppSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => summarizeBills(items), [items]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const selectedClassBills = useMemo(
    () => (selectedClass ? billsForClass(items, selectedClass.id) : []),
    [items, selectedClass],
  );

  async function loadData(activeToken: string) {
    const { profileData, billData, classData } = await fetchSppData(activeToken, {
      year,
      month,
      statusFilter,
    });
    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setItems(billData.data.data);
    setClasses(classData.data);
  }

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(activeToken);

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      fetchSppData(activeToken, { year, month, statusFilter })
        .then(({ profileData, billData, classData }) => {
          const isManager = ["ketua_akademi", "admin_akademi"].includes(profileData.user.role);
          setCanManage(isManager);
          setItems(billData.data.data);
          setClasses(classData.data);
          if (isManager) {
            getAkademiSppSettings(activeToken)
              .then((result) => setSettings(result.spp_settings))
              .catch(() => setError("Gagal memuat pengaturan SPP."));
          }
        })
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat SPP."))
        .finally(() => setIsLoading(false));
    });
  }, [month, statusFilter, year]);

  function openPayment(item: SppBill) {
    setPayTarget(item);
    setError("");
    setMessage("");
    setReceiptPaymentId(null);
  }

  async function handlePaid(paidBill: SppBill) {
    await loadData(token);
    setPayTarget(null);
    setMessage("Pembayaran SPP tersimpan.");
    const latestPayment = (paidBill.payments ?? []).reduce<number | null>((latest, payment) => Math.max(latest ?? 0, payment.id), null);
    setReceiptPaymentId(latestPayment);
  }

  function openWaive(item: SppBill) {
    setWaiveTarget(item);
    setError("");
    setMessage("");
    setReceiptPaymentId(null);
  }

  async function handleWaived() {
    await loadData(token);
    setWaiveTarget(null);
    setMessage("Tagihan dibebaskan.");
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat SPP...</p>;

  const columns = buildSppBillColumns({ canManage, onPay: openPayment, onWaive: openWaive });

  return (
    <>
      <section className="space-y-5 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard label="Siswa Tertagih" value={items.length} caption={`${SPP_MONTH_LABELS[month - 1]} ${year}`} tone="text-primary" />
          <StatCard label="Lunas" value={summary.paidCount} caption={`${summary.waivedCount} dibebaskan`} tone="text-success" />
          <div className="col-span-2 sm:col-span-1">
            <StatCard label="Perlu Ditindaklanjuti" value={summary.unpaidCount} caption={`${summary.partialCount} pembayaran sebagian`} tone="text-secondary" />
          </div>
        </div>

        <section className="card-soft bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="label-caps text-secondary">Administrasi</p>
                <h2 className="font-heading text-xl font-bold text-primary">Rekap SPP</h2>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <button
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark sm:flex-none"
                    onClick={() => setIsGenerateOpen(true)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    Buat Tagihan Bulan Ini
                  </button>
                  <button
                    aria-label="Pengaturan SPP"
                    className="inline-flex size-11 shrink-0 items-center justify-center border border-border bg-white text-primary transition hover:border-primary"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Pengaturan SPP"
                    type="button"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]">settings</span>
                  </button>
                </div>
              ) : null}
            </div>
            {view === "bills" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <label>
                <span className="sr-only">Tahun</span>
                <input className={filterClass} type="number" inputMode="numeric" value={year} onChange={(event) => {
                  setSelectedClassId("");
                  setYear(Number(event.target.value));
                }} />
              </label>
              <label>
                <span className="sr-only">Bulan</span>
                <select className={filterClass} value={month} onChange={(event) => {
                  setSelectedClassId("");
                  setMonth(Number(event.target.value));
                }}>
                  {SPP_MONTH_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
                </select>
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className="sr-only">Status tagihan</span>
                <select className={filterClass} value={statusFilter} onChange={(event) => {
                  setSelectedClassId("");
                  setStatusFilter(event.target.value);
                }}>
                  <option value="all">Semua</option>
                  <option value="unpaid">Belum lunas</option>
                  <option value="partial">Sebagian</option>
                  <option value="paid">Lunas</option>
                  <option value="waived">Dibebaskan</option>
                  <option value={OVERDUE_FILTER}>Terlambat</option>
                </select>
              </label>
            </div>
            ) : null}
          </div>

          {canManage ? (
            <div className="mt-4 grid grid-cols-2 border border-border sm:inline-grid" role="group" aria-label="Tampilan SPP">
              {SPP_VIEWS.map((option) => (
                <button
                  key={option.value}
                  aria-pressed={view === option.value}
                  className={`min-h-11 px-5 text-sm font-bold transition ${view === option.value ? "bg-primary text-white" : "bg-white text-primary hover:bg-surface-container-low"}`}
                  onClick={() => setView(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
              {message}
              {receiptPaymentId ? (
                <Link className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-2" href={`/academy/spp/receipts/${receiptPaymentId}`}>
                  Lihat kwitansi
                </Link>
              ) : null}
            </p>
          ) : null}
          {error ? <p className="mt-4 border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

          {view === "arrears" ? (
            <SppArrearsSection token={token} />
          ) : !selectedClass ? (
            <SppClassSummaryList classes={classes} bills={items} onSelect={(classId) => setSelectedClassId(String(classId))} />
          ) : (
            <SppClassBills
              classItem={selectedClass}
              bills={selectedClassBills}
              columns={columns}
              periodLabel={`${SPP_MONTH_LABELS[month - 1]} ${year}`}
              onBack={() => setSelectedClassId("")}
            />
          )}
        </section>
      </section>

      {isGenerateOpen ? (
        <SppGenerateModal token={token} classes={classes} settings={settings} onClose={() => setIsGenerateOpen(false)} onGenerated={() => loadData(token)} />
      ) : null}

      {isSettingsOpen ? (
        <SppSettingsModal
          token={token}
          settings={settings ?? DEFAULT_SPP_SETTINGS}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={(saved) => {
            setSettings(saved);
            setIsSettingsOpen(false);
            setReceiptPaymentId(null);
            setMessage("Pengaturan SPP tersimpan.");
          }}
        />
      ) : null}

      {waiveTarget ? (
        <SppWaiveModal key={waiveTarget.id} token={token} bill={waiveTarget} onClose={() => setWaiveTarget(null)} onWaived={handleWaived} />
      ) : null}

      {payTarget ? (
        <SppPaymentModal key={payTarget.id} token={token} bill={payTarget} onClose={() => setPayTarget(null)} onPaid={handlePaid} />
      ) : null}
    </>
  );
}
