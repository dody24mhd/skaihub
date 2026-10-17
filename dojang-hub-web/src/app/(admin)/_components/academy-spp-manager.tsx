"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SppBill,
  TrainingClass,
  getAkademiClasses,
  getAkademiMe,
  getAkademiSppBills,
  waiveAkademiSppBill,
} from "../_lib/admin-api";
import { buildSppBillColumns } from "./spp/spp-bill-columns";
import SppClassSummaryList from "./spp/spp-class-summary-list";
import SppGenerateModal from "./spp/spp-generate-modal";
import SppPaymentModal from "./spp/spp-payment-modal";
import { SPP_MONTH_LABELS, billsForClass, summarizeBills } from "./spp/spp-summary";
import { ResponsiveList } from "./ui";
import { useCanWrite } from "./ui/subscription-status";

const TOKEN_KEY = "skaihub_admin_token";

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
      status: filters.statusFilter,
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
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const canWrite = useCanWrite();
  const canEdit = canManage && canWrite;
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
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
          setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
          setItems(billData.data.data);
          setClasses(classData.data);
        })
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat SPP."))
        .finally(() => setIsLoading(false));
    });
  }, [month, statusFilter, year]);

  function openPayment(item: SppBill) {
    setPayTarget(item);
    setError("");
    setMessage("");
  }

  async function handlePaid() {
    await loadData(token);
    setPayTarget(null);
    setMessage("Pembayaran SPP tersimpan.");
  }

  async function handleWaive(item: SppBill) {
    const confirmed = window.confirm(`Bebaskan tagihan SPP ${item.student?.name || "siswa ini"}?`);
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await waiveAkademiSppBill(token, item.id, "Dibebaskan oleh admin.");
      await loadData(token);
      setMessage("Tagihan dibebaskan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membebaskan tagihan.");
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat SPP...</p>;

  const columns = buildSppBillColumns({ canManage: canEdit, onPay: openPayment, onWaive: handleWaive });

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
              {canEdit ? (
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark sm:w-auto"
                  onClick={() => setIsGenerateOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Buat Tagihan Bulan Ini
                </button>
              ) : null}
            </div>
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
                </select>
              </label>
            </div>
          </div>

          {message ? <p className="mt-4 border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
          {error ? <p className="mt-4 border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

          {!selectedClass ? (
            <SppClassSummaryList classes={classes} bills={items} onSelect={(classId) => setSelectedClassId(String(classId))} />
          ) : (
            <>
              <div className="mt-5 flex flex-col gap-3 border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-primary">{selectedClass.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {selectedClassBills.length} tagihan pada {SPP_MONTH_LABELS[month - 1]} {year}
                  </p>
                </div>
                <button className="min-h-11 border border-border bg-white px-4 text-sm font-bold text-primary" onClick={() => setSelectedClassId("")} type="button">
                  Kembali ke Daftar Kelas
                </button>
              </div>
              <ResponsiveList
                className="mt-5"
                columns={columns}
                rows={selectedClassBills}
                getRowKey={(item) => item.id}
                ariaLabel={`Tagihan SPP ${selectedClass.name}`}
                emptyState={<p className="mt-5 border-2 border-dashed border-border p-8 text-center text-sm text-muted">Belum ada tagihan SPP untuk kelas ini.</p>}
              />
            </>
          )}
        </section>
      </section>

      {isGenerateOpen ? (
        <SppGenerateModal token={token} classes={classes} onClose={() => setIsGenerateOpen(false)} onGenerated={() => loadData(token)} />
      ) : null}

      {payTarget ? (
        <SppPaymentModal key={payTarget.id} token={token} bill={payTarget} onClose={() => setPayTarget(null)} onPaid={handlePaid} />
      ) : null}
    </>
  );
}
