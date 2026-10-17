"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminInquiry,
  deleteAdminInquiry,
  getAdminInquiries,
  updateAdminInquiry,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const planLabels: Record<NonNullable<AdminInquiry["plan_interest"]>, string> = {
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
  konsultasi: "Konsultasi",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createWhatsappUrl(inquiry: AdminInquiry) {
  const phone = inquiry.phone.replace(/[^\d]/g, "").replace(/^0/, "62");
  const message = encodeURIComponent(
    `Halo ${inquiry.person_name}, kami dari SKAIHUB ingin menindaklanjuti pertanyaan Anda tentang digitalisasi akademi bela diri.`,
  );

  return `https://wa.me/${phone}?text=${message}`;
}

export default function AdminInquiryManager() {
  const [token, setToken] = useState("");
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "done">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminInquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredInquiries = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return inquiries.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "new" && !item.is_followed_up) ||
        (statusFilter === "done" && item.is_followed_up);

      const matchesQuery =
        !keyword ||
        item.person_name.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword) ||
        (item.akademi_name || "").toLowerCase().includes(keyword) ||
        (item.city || "").toLowerCase().includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [inquiries, query, statusFilter]);

  const stats = useMemo(
    () => [
      { label: "Total Pesan", value: inquiries.length, icon: "inbox" },
      {
        label: "Belum Follow Up",
        value: inquiries.filter((item) => !item.is_followed_up).length,
        icon: "mark_email_unread",
      },
      {
        label: "Sudah Follow Up",
        value: inquiries.filter((item) => item.is_followed_up).length,
        icon: "task_alt",
      },
    ],
    [inquiries],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login admin dulu untuk membuka pesan masuk.");
        return;
      }

      getAdminInquiries(savedToken)
        .then(setInquiries)
        .catch((caught: Error) => setError(caught.message))
        .finally(() => setIsLoading(false));
    });
  }, []);

  async function refreshData() {
    if (!token) return;

    setError("");
    const data = await getAdminInquiries(token);
    setInquiries(data);
  }

  async function toggleFollowUp(item: AdminInquiry) {
    setError("");
    setMessage("");

    try {
      const updated = await updateAdminInquiry(token, item.id, {
        is_followed_up: !item.is_followed_up,
      });
      setInquiries((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setMessage(updated.is_followed_up ? "Pesan ditandai sudah follow up." : "Pesan ditandai belum follow up.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Status pesan gagal diupdate.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setError("");
    setMessage("");

    try {
      await deleteAdminInquiry(token, deleteTarget.id);
      setInquiries((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("Pesan berhasil dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pesan gagal dihapus.");
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="card-soft rounded-lg bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">{item.label}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-primary">{item.value}</p>
              </div>
              <span className="material-symbols-outlined text-[26px] text-secondary">{item.icon}</span>
            </div>
          </article>
        ))}
      </div>

      {message ? (
        <div className="mb-4 rounded-md bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-md bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary">
          {error}
        </div>
      ) : null}

      <section className="card-soft rounded-lg bg-white">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="label-caps mb-2 text-secondary">CMS Hubungi</p>
              <h2 className="text-xl font-bold text-primary">Daftar Pesan Masuk</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted">
                  search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-64"
                  placeholder="Cari pesan"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Semua status</option>
                <option value="new">Belum follow up</option>
                <option value="done">Sudah follow up</option>
              </select>
              <button
                type="button"
                onClick={refreshData}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-sm text-muted">Memuat pesan masuk...</div>
          ) : filteredInquiries.length ? (
            filteredInquiries.map((item) => (
              <article key={item.id} className="p-5 transition hover:bg-surface/70">
                <div className="grid gap-5 xl:grid-cols-[1fr_220px_210px] xl:items-start">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_followed_up ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {item.is_followed_up ? "Sudah follow up" : "Belum follow up"}
                      </span>
                      {item.plan_interest ? (
                        <span className="rounded-full border border-border bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted">
                          {planLabels[item.plan_interest]}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-primary">{item.person_name}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">
                      {item.akademi_name || "Akademi belum diisi"}{item.city ? ` - ${item.city}` : ""}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                      {item.message || "Tidak ada pesan tambahan."}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold text-primary">{item.phone}</p>
                    <p className="mt-1 text-muted">{formatDate(item.created_at)}</p>
                    <p className="mt-1 text-muted">{item.source_page || "Sumber tidak tercatat"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <a
                      href={createWhatsappUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleFollowUp(item)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.is_followed_up ? "undo" : "task_alt"}
                      </span>
                      {item.is_followed_up ? "Undo" : "Selesai"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-secondary/10 hover:text-secondary"
                      aria-label={`Hapus pesan ${item.person_name}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-sm text-muted">Belum ada pesan masuk.</div>
          )}
        </div>
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-sm">
          <section className="card-soft w-full max-w-[420px] rounded-lg bg-white p-5">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <h2 className="text-xl font-bold text-primary">Hapus pesan?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Pesan dari <span className="font-semibold text-primary">{deleteTarget.person_name}</span> akan dihapus permanen dari CMS.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:bg-secondary-dark"
              >
                Hapus
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

