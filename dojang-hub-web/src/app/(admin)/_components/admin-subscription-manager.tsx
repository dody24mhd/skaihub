"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AdminAkademi,
  AdminSubscription,
  AkademiEntitlements,
  AkademiPlan,
  SubscriptionDuration,
  SubscriptionPaymentStatus,
  createAdminSubscription,
  getAdminAkademi,
  getAdminAkademiDetail,
  getAdminSubscriptions,
  updateAdminSubscriptionPayment,
  uploadAdminImage,
} from "../_lib/admin-api";
import AdminShell from "./admin-shell";
import SubscriptionPricePreview, { extraStudentsToBlocks } from "./subscription-price-preview";
import { EXTRA_BLOCK_SIZE, PLAN_RULES, effectiveStudentLimit } from "@/lib/plan-pricing";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const planLabels: Record<AkademiPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

const planColors: Record<AkademiPlan, string> = {
  starter: "bg-surface-container text-muted",
  pro: "bg-secondary/10 text-secondary",
  scale: "bg-primary/10 text-primary",
};

const durationLabels: Record<SubscriptionDuration, string> = {
  trial: "Trial 14 hari",
  monthly: "1 bulan",
  quarterly: "3 bulan",
  semester: "6 bulan",
  yearly: "12 bulan",
  custom: "Custom (tentukan tanggal)",
};

const paymentLabels: Record<SubscriptionPaymentStatus, string> = {
  unpaid: "Belum bayar",
  paid: "Lunas",
  waived: "Gratis / waived",
  refunded: "Refunded",
};

const paymentStatusColors: Record<SubscriptionPaymentStatus, string> = {
  unpaid: "text-warning",
  paid: "text-success-strong",
  waived: "text-muted",
  refunded: "text-secondary",
};

const statusLabels: Record<AdminSubscription["status"], string> = {
  trialing: "Trial",
  active: "Aktif",
  past_due: "Past due",
  expired: "Expired",
  cancelled: "Dibatalkan",
};

const statusColors: Record<AdminSubscription["status"], string> = {
  active: "bg-success/10 text-success-strong",
  trialing: "bg-secondary/10 text-secondary",
  past_due: "bg-warning/15 text-warning",
  expired: "bg-surface-container text-muted",
  cancelled: "bg-surface-container text-muted",
};

const defaultForm = {
  plan: "starter" as AkademiPlan,
  duration_type: "monthly" as SubscriptionDuration,
  starts_at: "",
  ends_at: "",
  extra_students: "",   // in siswa units, converted to blocks before sending
  amount: "",
  payment_status: "unpaid" as SubscriptionPaymentStatus,
  payment_method: "",
  payment_proof_url: "",
  notes: "",
};

const defaultPaymentForm = {
  amount: "",
  payment_status: "unpaid" as SubscriptionPaymentStatus,
  payment_method: "",
  payment_proof_url: "",
  notes: "",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function totalStudentLimit(sub: AdminSubscription) {
  return effectiveStudentLimit(sub.plan, sub.extra_student_blocks, sub.included_student_limit);
}

function paymentFormFromSubscription(subscription: AdminSubscription | null) {
  if (!subscription) return defaultPaymentForm;

  return {
    amount: String(Number(subscription.subtotal_amount || subscription.amount || 0)),
    payment_status: subscription.payment_status,
    payment_method: subscription.payment_method ?? "",
    payment_proof_url: subscription.payment_proof_url ?? "",
    notes: subscription.notes ?? "",
  };
}

function EntitlementRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted">{label}</span>
      {active ? (
        <span className="flex items-center gap-1 font-medium text-success-strong">
          <Icon name="check_circle" className="text-[15px]" />
          Aktif
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted/60">
          <Icon name="cancel" className="text-[15px]" />
          Tidak aktif
        </span>
      )}
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="label-caps text-muted">{label}</p>
      {hint ? <p className="text-xs text-muted/70">{hint}</p> : null}
      {children}
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface disabled:text-muted";

export default function AdminSubscriptionManager() {
  const [token, setToken] = useState("");
  const [akademi, setAkademi] = useState<AdminAkademi[]>([]);
  const [selectedAkademiId, setSelectedAkademiId] = useState<number | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [entitlements, setEntitlements] = useState<AkademiEntitlements | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [formMode, setFormMode] = useState<"payment" | "new">("payment");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAkademi = useMemo(
    () => akademi.find((a) => a.id === selectedAkademiId) ?? null,
    [akademi, selectedAkademiId],
  );

  const activeSubscription = useMemo(
    () =>
      subscriptions.find((s) => ["trialing", "active", "past_due"].includes(s.status)) ??
      subscriptions[0] ??
      null,
    [subscriptions],
  );

  // Load token + akademi on mount
  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) ?? "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login sebagai super admin dulu untuk membuka data langganan.");
        return;
      }

      getAdminAkademi(savedToken)
        .then((data) => {
          setAkademi(data);
          const first = data[0] ?? null;
          if (first) {
            setSelectedAkademiId(first.id);
            setForm((cur) => ({ ...cur, plan: first.plan }));
          }
        })
        .catch((err: Error) => setError(`Gagal memuat daftar akademi: ${err.message}`))
        .finally(() => setIsLoading(false));
    });
  }, []);

  // Load subscriptions + entitlements when selection changes
  useEffect(() => {
    if (!token || !selectedAkademiId) return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      setIsLoadingSubscriptions(true);
      setApiError("");
      setSubscriptions([]);
      setEntitlements(null);

      Promise.all([
        getAdminSubscriptions(token, selectedAkademiId),
        getAdminAkademiDetail(token, selectedAkademiId),
      ])
        .then(([subs, detail]) => {
          if (!active) return;
          setSubscriptions(subs);
          setEntitlements(detail.entitlements ?? null);
          setPaymentForm(paymentFormFromSubscription(
            subs.find((s) => ["trialing", "active", "past_due"].includes(s.status)) ??
              subs[0] ??
              null,
          ));
        })
        .catch((err: Error) => {
          if (active) setApiError(`Gagal memuat data: ${err.message}`);
        })
        .finally(() => {
          if (active) setIsLoadingSubscriptions(false);
        });
    });

    return () => {
      active = false;
    };
  }, [selectedAkademiId, token]);

  function handleSelectAkademi(value: string) {
    const nextId = Number(value);
    const next = akademi.find((a) => a.id === nextId) ?? null;
    setSelectedAkademiId(nextId);
    setForm({ ...defaultForm, plan: next?.plan ?? "starter" });
    setPaymentForm(defaultPaymentForm);
    setFormMode("payment");
    setMessage("");
    setError("");
    setApiError("");
  }

  async function handleUploadBukti(file: File) {
    setIsUploading(true);
    try {
      const result = await uploadAdminImage(token, file);
      if (formMode === "payment") {
        setPaymentForm((cur) => ({ ...cur, payment_proof_url: result.url }));
      } else {
        setForm((cur) => ({ ...cur, payment_proof_url: result.url }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAkademiId) return;

    if (form.duration_type === "custom" && !form.ends_at) {
      setError("Tanggal akhir wajib diisi untuk durasi custom.");
      return;
    }

    const extraStudents = Number(form.extra_students || 0);
    if (extraStudents % EXTRA_BLOCK_SIZE !== 0) {
      setError(`Jumlah siswa tambahan harus kelipatan ${EXTRA_BLOCK_SIZE}.`);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await createAdminSubscription(token, selectedAkademiId, {
        plan: form.plan,
        duration_type: form.duration_type,
        starts_at: form.starts_at || null,
        ends_at: form.duration_type === "custom" ? form.ends_at : null,
        extra_student_blocks: extraStudentsToBlocks(form.extra_students),
        amount: form.amount === "" ? undefined : Number(form.amount),
        payment_status: form.payment_status,
        payment_method: form.payment_method.trim() || null,
        payment_proof_url: form.payment_proof_url.trim() || null,
        notes: form.notes.trim() || null,
      });

      const [nextAkademi, nextSubs, nextDetail] = await Promise.all([
        getAdminAkademi(token),
        getAdminSubscriptions(token, selectedAkademiId),
        getAdminAkademiDetail(token, selectedAkademiId),
      ]);

      setAkademi(nextAkademi);
      setSubscriptions(nextSubs);
      setEntitlements(nextDetail.entitlements ?? null);
      setPaymentForm(paymentFormFromSubscription(
        nextSubs.find((s) => ["trialing", "active", "past_due"].includes(s.status)) ??
          nextSubs[0] ??
          null,
      ));
      setFormMode("payment");
      setForm((cur) => ({ ...defaultForm, plan: cur.plan }));
      setMessage("Langganan berhasil dibuat.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Langganan gagal dibuat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAkademiId || !activeSubscription) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await updateAdminSubscriptionPayment(token, selectedAkademiId, activeSubscription.id, {
        subtotal_amount: Number(paymentForm.amount || 0),
        payment_status: paymentForm.payment_status,
        payment_method: paymentForm.payment_method.trim() || null,
        payment_proof_url: paymentForm.payment_proof_url.trim() || null,
        notes: paymentForm.notes.trim() || null,
      });

      const [nextAkademi, nextSubs, nextDetail] = await Promise.all([
        getAdminAkademi(token),
        getAdminSubscriptions(token, selectedAkademiId),
        getAdminAkademiDetail(token, selectedAkademiId),
      ]);

      setAkademi(nextAkademi);
      setSubscriptions(nextSubs);
      setEntitlements(nextDetail.entitlements ?? null);
      setPaymentForm(paymentFormFromSubscription(
        nextSubs.find((s) => s.id === activeSubscription.id) ?? activeSubscription,
      ));
      setMessage("Pembayaran langganan berhasil diupdate.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pembayaran gagal diupdate.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell
      title="Langganan"
      eyebrow="Platform"
      description="Kelola paket, masa aktif, pembayaran, dan kapasitas siswa akademi."
    >
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── LEFT ── */}
        <div className="space-y-5">

          {/* Akademi selector + snapshot */}
          <section className="rounded-xl bg-white p-5 ring-1 ring-border">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
              <FormField label="Akademi">
                <select
                  value={selectedAkademiId ?? ""}
                  onChange={(e) => handleSelectAkademi(e.target.value)}
                  className={inputCls}
                  disabled={isLoading || akademi.length === 0}
                >
                  {isLoading ? (
                    <option>Memuat...</option>
                  ) : akademi.length === 0 ? (
                    <option>Tidak ada akademi</option>
                  ) : (
                    akademi.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} / {item.slug}
                      </option>
                    ))
                  )}
                </select>
              </FormField>

              <div className="flex flex-col justify-center rounded-lg border border-border bg-surface px-4 py-3">
                <p className="label-caps text-muted">Paket aktif</p>
                {selectedAkademi ? (
                  <>
                    <span className={`mt-1.5 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${planColors[selectedAkademi.plan]}`}>
                      {planLabels[selectedAkademi.plan]}
                    </span>
                    <p className="mt-1.5 text-xs text-muted">
                      s/d {formatDate(selectedAkademi.plan_expires_at)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted">—</p>
                )}
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="mt-4 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success-strong">
                {message}
              </div>
            ) : null}
          </section>

          {/* Entitlements */}
          {selectedAkademi && entitlements ? (
            <section className="rounded-xl bg-white p-5 ring-1 ring-border">
              <p className="label-caps mb-1 text-secondary">Entitlements</p>
              <p className="mb-3 text-sm font-semibold text-primary">
                Fitur aktif untuk {selectedAkademi.name}
              </p>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted">Kuota siswa</span>
                  <span className="font-bold text-primary">{entitlements.student_limit.toLocaleString("id-ID")} siswa</span>
                </div>
                <EntitlementRow label="Landing page publik" active={entitlements.has_public_website} />
                <EntitlementRow label="Subdomain (slug.skaihub.com)" active={entitlements.has_subdomain} />
                <EntitlementRow label="Penilaian siswa" active={entitlements.has_rapor} />
              </div>
            </section>
          ) : null}

          {/* Riwayat */}
          <section className="overflow-hidden rounded-xl bg-white ring-1 ring-border">
            <div className="border-b border-border px-5 py-4">
              <p className="label-caps mb-0.5 text-secondary">Riwayat</p>
              <h2 className="text-base font-bold text-primary">Riwayat Langganan</h2>
            </div>

            {apiError ? (
              <div className="m-5 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
                {apiError}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Paket</th>
                    <th className="px-5 py-3 font-medium">Masa Aktif</th>
                    <th className="px-5 py-3 font-medium">Kuota Siswa</th>
                    <th className="px-5 py-3 font-medium">Tagihan</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingSubscriptions ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted">
                        Memuat riwayat...
                      </td>
                    </tr>
                  ) : subscriptions.length > 0 ? (
                    subscriptions.map((item) => {
                      const base = item.included_student_limit;
                      const addon = item.extra_student_blocks * EXTRA_BLOCK_SIZE;
                      const bonus = PLAN_RULES[item.plan].freeExtraBlocks * EXTRA_BLOCK_SIZE;
                      const total = totalStudentLimit(item);
                      return (
                        <tr key={item.id} className="align-top hover:bg-surface/40">
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${planColors[item.plan]}`}>
                              {planLabels[item.plan]}
                            </span>
                            <p className="mt-1 text-xs text-muted">{durationLabels[item.duration_type]}</p>
                          </td>
                          <td className="px-5 py-4 text-muted">
                            <p className="text-xs">{formatDate(item.starts_at)}</p>
                            <p className="text-xs">s/d {formatDate(item.ends_at)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-primary">{total.toLocaleString("id-ID")} siswa</p>
                            <p className="mt-0.5 text-xs text-muted">
                              {`${base} bawaan + ${bonus} bonus`}
                              {addon > 0 ? ` + ${addon} berbayar` : ""}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-primary">{formatMoney(item.amount)}</p>
                            <p className={`mt-0.5 text-xs font-medium ${paymentStatusColors[item.payment_status]}`}>
                              {paymentLabels[item.payment_status]}
                            </p>
                            {item.payment_method ? (
                              <p className="mt-0.5 text-xs text-muted">{item.payment_method}</p>
                            ) : null}
                            {item.payment_proof_url ? (
                              <a
                                href={item.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Icon name="receipt_long" className="text-[13px]" />
                                Bukti
                              </a>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusColors[item.status]}`}>
                              {statusLabels[item.status]}
                            </span>
                            {item.notes ? (
                              <p className="mt-1 max-w-[140px] truncate text-xs text-muted" title={item.notes}>
                                {item.notes}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted">
                        {selectedAkademiId
                          ? "Belum ada riwayat langganan untuk akademi ini."
                          : "Pilih akademi untuk melihat riwayat."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── RIGHT — Form ── */}
        <aside>
          <div className="rounded-xl bg-white p-5 ring-1 ring-border">
            <p className="label-caps mb-0.5 text-secondary">Langganan</p>
            <h2 className="text-base font-bold text-primary">
              {formMode === "payment" ? "Pembayaran Aktif" : "Perpanjang / Ubah Paket"}
            </h2>
            <div className="mt-3 grid grid-cols-2 rounded-lg bg-surface p-1">
              <button
                type="button"
                onClick={() => setFormMode("payment")}
                className={`h-9 rounded-md text-xs font-bold transition ${
                  formMode === "payment" ? "bg-white text-primary shadow-sm" : "text-muted"
                }`}
              >
                Pembayaran
              </button>
              <button
                type="button"
                onClick={() => setFormMode("new")}
                className={`h-9 rounded-md text-xs font-bold transition ${
                  formMode === "new" ? "bg-white text-primary shadow-sm" : "text-muted"
                }`}
              >
                Langganan Baru
              </button>
            </div>

            {activeSubscription ? (
              <div className="mt-3 rounded-lg border border-border bg-surface px-3.5 py-3 text-xs leading-5 text-muted">
                Aktif saat ini:{" "}
                <span className="font-semibold text-primary">{planLabels[activeSubscription.plan]}</span>
                {" "}·{" "}
                <span className="font-semibold text-primary">{totalStudentLimit(activeSubscription).toLocaleString("id-ID")} siswa</span>
                {" "}s/d {formatDate(activeSubscription.ends_at)}
              </div>
            ) : null}

            {formMode === "payment" ? (
              activeSubscription ? (
                <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
                  <p className="text-xs leading-5 text-muted">
                    Update nominal, status bayar, bukti pembayaran, dan catatan
                    subscription yang sudah ada tanpa membuat periode langganan baru.
                  </p>

                  <div className="rounded-lg border border-border bg-surface px-3.5 py-3 text-xs leading-5 text-muted">
                    <span className="font-semibold text-primary">
                      {planLabels[activeSubscription.plan]}
                    </span>{" "}
                    sampai {formatDate(activeSubscription.ends_at)}
                  </div>

                  <FormField label="Nominal sebelum diskon (Rp)">
                    <input
                      type="number"
                      min={0}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((cur) => ({ ...cur, amount: e.target.value }))}
                      className={inputCls}
                    />
                  </FormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Status pembayaran">
                      <select
                        value={paymentForm.payment_status}
                        onChange={(e) =>
                          setPaymentForm((cur) => ({
                            ...cur,
                            payment_status: e.target.value as SubscriptionPaymentStatus,
                          }))
                        }
                        className={inputCls}
                      >
                        {Object.entries(paymentLabels).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Metode bayar">
                      <input
                        value={paymentForm.payment_method}
                        onChange={(e) =>
                          setPaymentForm((cur) => ({ ...cur, payment_method: e.target.value }))
                        }
                        placeholder="Transfer, Cash, QRIS..."
                        className={inputCls}
                      />
                    </FormField>
                  </div>

                  <FormField label="Bukti pembayaran">
                    <div className="space-y-2">
                      {paymentForm.payment_proof_url ? (
                        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                          <Icon name="check_circle" className="text-[18px] text-success-strong" />
                          <a
                            href={paymentForm.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 truncate text-xs text-primary hover:underline"
                          >
                            Bukti terupload
                          </a>
                          <button
                            type="button"
                            aria-label="Hapus bukti pembayaran"
                            onClick={() => {
                              setPaymentForm((cur) => ({ ...cur, payment_proof_url: "" }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-muted hover:text-secondary"
                          >
                            <Icon name="close" className="text-[18px]" />
                          </button>
                        </div>
                      ) : null}
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted transition hover:border-primary hover:text-primary">
                        <Icon name="upload_file" className="text-[20px]" />
                        <span>{isUploading ? "Mengupload..." : "Upload / ganti bukti"}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadBukti(file);
                          }}
                        />
                      </label>
                    </div>
                  </FormField>

                  <FormField label="Catatan internal">
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm((cur) => ({ ...cur, notes: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="receipt_long" className="text-[18px]" />
                    {isSaving ? "Menyimpan..." : "Simpan Pembayaran"}
                  </button>
                </form>
              ) : (
                <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
                  Belum ada langganan untuk diupdate. Buat langganan baru dulu.
                </p>
              )
            ) : (
            <>
            <p className="mt-4 text-xs leading-5 text-muted">
              Membuat langganan baru dipakai untuk aktivasi manual, renewal, upgrade, atau
              downgrade. Subscription yang sedang berjalan tetap menjadi histori.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">

              {/* Paket + Durasi */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Paket">
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((cur) => ({ ...cur, plan: e.target.value as AkademiPlan }))}
                    className={inputCls}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="scale">Scale</option>
                  </select>
                </FormField>

                <FormField label="Durasi">
                  <select
                    value={form.duration_type}
                    onChange={(e) =>
                      setForm((cur) => ({ ...cur, duration_type: e.target.value as SubscriptionDuration }))
                    }
                    className={inputCls}
                  >
                    {Object.entries(durationLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Tanggal */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Tanggal mulai">
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setForm((cur) => ({ ...cur, starts_at: e.target.value }))}
                    className={inputCls}
                  />
                </FormField>
                {form.duration_type === "custom" ? (
                  <FormField label="Tanggal selesai *">
                    <input
                      type="date"
                      value={form.ends_at}
                      onChange={(e) => setForm((cur) => ({ ...cur, ends_at: e.target.value }))}
                      required
                      className={inputCls}
                    />
                  </FormField>
                ) : null}
              </div>

              <SubscriptionPricePreview
                plan={form.plan}
                duration={form.duration_type}
                startsAt={form.starts_at}
                endsAt={form.ends_at}
                extraStudents={form.extra_students}
                amount={form.amount}
                onExtraStudentsChange={(value) => setForm((cur) => ({ ...cur, extra_students: value }))}
                onAmountChange={(value) => setForm((cur) => ({ ...cur, amount: value }))}
              />

              {/* Status + Metode */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Status pembayaran">
                  <select
                    value={form.payment_status}
                    onChange={(e) =>
                      setForm((cur) => ({
                        ...cur,
                        payment_status: e.target.value as SubscriptionPaymentStatus,
                      }))
                    }
                    className={inputCls}
                  >
                    {Object.entries(paymentLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Metode bayar">
                  <input
                    type="text"
                    value={form.payment_method}
                    onChange={(e) =>
                      setForm((cur) => ({ ...cur, payment_method: e.target.value }))
                    }
                    placeholder="Transfer, Cash, QRIS..."
                    className={inputCls}
                  />
                </FormField>
              </div>

              {/* Upload bukti */}
              <FormField label="Bukti pembayaran">
                <div className="space-y-2">
                  {form.payment_proof_url ? (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                      <Icon name="check_circle" className="text-[18px] text-success-strong" />
                      <a
                        href={form.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 truncate text-xs text-primary hover:underline"
                      >
                        Bukti terupload
                      </a>
                      <button
                        type="button"
                        aria-label="Hapus bukti pembayaran"
                        onClick={() => {
                          setForm((cur) => ({ ...cur, payment_proof_url: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-muted hover:text-secondary"
                      >
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    </div>
                  ) : null}

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted transition hover:border-primary hover:text-primary">
                    <Icon name="upload_file" className="text-[20px]" />
                    <span>{isUploading ? "Mengupload..." : form.payment_proof_url ? "Ganti bukti" : "Upload bukti bayar"}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadBukti(file);
                      }}
                    />
                  </label>
                  <p className="text-xs text-muted">JPG, PNG, atau WebP · maks. 5 MB</p>
                </div>
              </FormField>

              {/* Catatan */}
              <FormField label="Catatan internal">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                  rows={3}
                  placeholder="Deal khusus, alasan perubahan, dsb."
                  className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </FormField>

              {error ? (
                <div className="rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!selectedAkademiId || isSaving || isUploading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="payments" className="text-[18px]" />
                {isSaving ? "Menyimpan..." : "Simpan Langganan"}
              </button>
            </form>
            </>
            )}
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
