"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  SppBill,
  TrainingClass,
  getAkademiClasses,
  getAkademiMe,
  getAkademiSppBills,
  payAkademiSppBill,
  uploadAkademiFile,
  waiveAkademiSppBill,
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

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

export default function AcademySppManager() {
  const tokenRef = useRef("");
  const now = new Date();
  const [items, setItems] = useState<SppBill[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [payTarget, setPayTarget] = useState<SppBill | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payMethod, setPayMethod] = useState("cash");
  const [proofUrl, setProofUrl] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    return items.reduce(
      (total, item) => {
        total.bill += Number(item.amount);
        total.paid += Number(item.paid_amount);
        if (item.status === "paid") total.paidCount++;
        if (item.status === "partial") total.partialCount++;
        if (item.status === "waived") total.waivedCount++;
        if (item.status === "unpaid" || item.status === "partial") total.unpaidCount++;
        return total;
      },
      { bill: 0, paid: 0, paidCount: 0, partialCount: 0, waivedCount: 0, unpaidCount: 0 },
    );
  }, [items]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const classSummaries = useMemo(() => classes.map((classItem) => {
    const classBills = items.filter((item) => item.class_id === classItem.id || item.student?.primary_class_id === classItem.id);
    const totals = classBills.reduce(
      (total, item) => {
        total.bill += Number(item.amount);
        total.paid += Number(item.paid_amount);
        if (item.status === "paid") total.paidCount++;
        if (item.status === "partial") total.partialCount++;
        if (item.status === "waived") total.waivedCount++;
        if (item.status === "unpaid" || item.status === "partial") total.unpaidCount++;
        return total;
      },
      { bill: 0, paid: 0, paidCount: 0, partialCount: 0, waivedCount: 0, unpaidCount: 0 },
    );

    return {
      classItem,
      billCount: classBills.length,
      ...totals,
    };
  }), [classes, items]);

  const selectedClassBills = useMemo(() => {
    if (!selectedClass) return [];
    return items.filter((item) => item.class_id === selectedClass.id || item.student?.primary_class_id === selectedClass.id);
  }, [items, selectedClass]);

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
      tokenRef.current = activeToken;

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
    setPayAmount(String(Math.max(Number(item.amount) - Number(item.paid_amount), 0)));
    setPayDate(today());
    setPayMethod("cash");
    setProofUrl("");
    setPayNotes("");
    setError("");
    setMessage("");
  }

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payTarget) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await payAkademiSppBill(tokenRef.current, payTarget.id, {
        amount: Number(payAmount),
        paid_at: payDate,
        method: payMethod || null,
        proof_url: proofUrl || null,
        notes: payNotes || null,
      });
      await loadData(tokenRef.current);
      setPayTarget(null);
      setMessage("Pembayaran SPP tersimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan pembayaran.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleProofUpload(file: File | null) {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const result = await uploadAkademiFile(tokenRef.current, file, "spp_proof");
      setProofUrl(result.url);
      setMessage("Bukti bayar terupload.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal upload bukti bayar.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleWaive(item: SppBill) {
    const confirmed = window.confirm(`Bebaskan tagihan SPP ${item.student?.name || "siswa ini"}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await waiveAkademiSppBill(tokenRef.current, item.id, "Dibebaskan oleh admin.");
      await loadData(tokenRef.current);
      setMessage("Tagihan dibebaskan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membebaskan tagihan.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat SPP...</p>;

  return (
    <>
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Siswa Tertagih</p>
            <p className="mt-2 text-2xl font-black text-primary">{items.length}</p>
            <p className="text-sm text-muted">{monthLabels[month - 1]} {year}</p>
          </article>
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Lunas</p>
            <p className="mt-2 text-2xl font-black text-success">{summary.paidCount}</p>
            <p className="text-sm text-muted">{summary.waivedCount} dibebaskan</p>
          </article>
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Perlu Ditindaklanjuti</p>
            <p className="mt-2 text-2xl font-black text-secondary">{summary.unpaidCount}</p>
            <p className="text-sm text-muted">{summary.partialCount} pembayaran sebagian</p>
          </article>
        </div>

        <section className="card-soft rounded-lg bg-white p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="label-caps text-secondary">Administrasi</p>
              <h2 className="font-heading text-xl font-bold text-primary">Rekap SPP</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input className="h-10 rounded-md border border-border px-3 text-sm" type="number" value={year} onChange={(event) => {
                setSelectedClassId("");
                setYear(Number(event.target.value));
              }} />
              <select className="h-10 rounded-md border border-border px-3 text-sm" value={month} onChange={(event) => {
                setSelectedClassId("");
                setMonth(Number(event.target.value));
              }}>
                {monthLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
              </select>
              <select className="h-10 rounded-md border border-border px-3 text-sm" value={statusFilter} onChange={(event) => {
                setSelectedClassId("");
                setStatusFilter(event.target.value);
              }}>
                <option value="all">Semua</option>
                <option value="unpaid">Belum lunas</option>
                <option value="partial">Sebagian</option>
                <option value="paid">Lunas</option>
                <option value="waived">Dibebaskan</option>
              </select>
            </div>
          </div>

          {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
          {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

          {!selectedClass ? (
            <div className="mt-5 divide-y divide-border">
              {classSummaries.map(({ classItem, billCount, paidCount, partialCount, waivedCount, unpaidCount }) => (
                <div key={classItem.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-primary">{classItem.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      SPP kelas saat ini {classItem.spp_amount_override ? money(classItem.spp_amount_override) : "belum diatur"}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-4 lg:min-w-[680px]">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted">Tertagih</p>
                      <p className="font-bold text-primary">{billCount} siswa</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted">Lunas</p>
                      <p className="font-bold text-success">{paidCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted">Sebagian</p>
                      <p className="font-bold text-primary">{partialCount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted">Tindak lanjut</p>
                      <p className="font-bold text-secondary">{unpaidCount}</p>
                      {waivedCount ? <p className="text-xs text-muted">{waivedCount} bebas</p> : null}
                    </div>
                  </div>
                  <button
                    className="h-10 rounded-md border border-border px-4 text-sm font-bold text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted"
                    disabled={!billCount}
                    onClick={() => setSelectedClassId(String(classItem.id))}
                    type="button"
                  >
                    Lihat Tabel
                  </button>
                </div>
              ))}
              {!classSummaries.length ? <p className="py-8 text-sm text-muted">Belum ada kelas.</p> : null}
            </div>
          ) : (
            <>
              <div className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-primary">{selectedClass.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {selectedClassBills.length} tagihan pada {monthLabels[month - 1]} {year}
                  </p>
                </div>
                <button className="h-10 rounded-md border border-border bg-white px-4 text-sm font-bold text-primary" onClick={() => setSelectedClassId("")} type="button">
                  Kembali ke Daftar Kelas
                </button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                      <th className="pb-3">Siswa</th>
                      <th className="pb-3">Tagihan</th>
                      <th className="pb-3">Terbayar</th>
                      <th className="pb-3">Status</th>
                      {canManage ? <th className="pb-3 text-right">Aksi</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedClassBills.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-bold text-primary">
                          {item.student?.name || "-"}
                          <span className="block text-xs font-medium text-muted">{monthLabels[item.billing_month - 1]} {item.billing_year}</span>
                        </td>
                        <td className="py-3 text-muted">{money(item.amount)}</td>
                        <td className="py-3 text-muted">{money(item.paid_amount)}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "paid" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        {canManage ? (
                          <td className="py-3 text-right">
                            {item.status !== "paid" && item.status !== "waived" ? (
                              <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => openPayment(item)} type="button">Bayar</button>
                            ) : null}
                            {item.status !== "paid" && item.status !== "waived" ? (
                              <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleWaive(item)} type="button">Bebaskan</button>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                    {!selectedClassBills.length ? (
                      <tr><td className="py-8 text-sm text-muted" colSpan={canManage ? 5 : 4}>Belum ada tagihan SPP untuk kelas ini.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </section>

      {payTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4">
          <section className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label-caps text-secondary">Pembayaran</p>
                <h2 className="font-heading text-lg font-bold text-primary">{payTarget.student?.name || "Siswa"}</h2>
                <p className="mt-1 text-sm text-muted">
                  Tagihan {money(payTarget.amount)} - Terbayar {money(payTarget.paid_amount)}
                </p>
              </div>
              <button
                className="flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-surface-container-low"
                onClick={() => setPayTarget(null)}
                type="button"
                aria-label="Tutup modal pembayaran"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handlePay}>
              <label className="block text-sm font-semibold text-primary">
                Nominal bayar
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-primary">
                  Tanggal
                  <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} required />
                </label>
                <label className="block text-sm font-semibold text-primary">
                  Metode
                  <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={payMethod} onChange={(event) => setPayMethod(event.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-primary">
                Bukti bayar
                <input className="mt-2 block w-full text-sm text-muted" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => handleProofUpload(event.target.files?.[0] || null)} />
                {proofUrl ? <a className="mt-2 inline-flex text-xs font-bold text-secondary" href={proofUrl} target="_blank" rel="noreferrer">Bukti terupload</a> : null}
                {isUploading ? <span className="mt-2 block text-xs text-muted">Mengupload...</span> : null}
              </label>
              <label className="block text-sm font-semibold text-primary">
                Catatan
                <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm" value={payNotes} onChange={(event) => setPayNotes(event.target.value)} />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving || isUploading} type="submit">Simpan Pembayaran</button>
                <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={() => setPayTarget(null)} type="button">Batal</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
