"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminFaq,
  createAdminFaq,
  FaqPayload,
  getAdminFaqs,
  updateAdminFaq,
  deleteAdminFaq,
} from "../_lib/admin-api";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const emptyForm = {
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminFaqManager() {
  const [token, setToken] = useState("");
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFaq | null>(null);
  const [editTarget, setEditTarget] = useState<AdminFaq | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => form.question.trim().length > 5 && form.answer.trim().length > 5 && token,
    [form.question, form.answer, token],
  );

  const filteredItems = useMemo(() => {
    return faqs.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active) ||
        (statusFilter === "inactive" && !item.is_active);
      
      const keyword = query.trim().toLowerCase();
      const matchesQuery =
        !keyword ||
        item.question.toLowerCase().includes(keyword) ||
        item.answer.toLowerCase().includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [faqs, query, statusFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login admin dulu untuk membuka data FAQ.");
        return;
      }

      getAdminFaqs(savedToken)
        .then(setFaqs)
        .catch((caught: Error) => setError(caught.message))
        .finally(() => setIsLoading(false));
    });
  }, []);

  async function refreshData() {
    if (!token) return;

    setError("");
    const data = await getAdminFaqs(token);
    setFaqs(data);
  }

  function openForm(item?: AdminFaq) {
    if (item) {
      setEditTarget(item);
      setForm({
        question: item.question,
        answer: item.answer,
        sort_order: item.sort_order || 0,
        is_active: item.is_active,
      });
    } else {
      setEditTarget(null);
      setForm(emptyForm);
    }
    setMessage("");
    setError("");
    setIsDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Pertanyaan dan Jawaban wajib diisi.");
      return;
    }

    const payload: FaqPayload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    setIsSaving(true);

    try {
      if (editTarget) {
        await updateAdminFaq(token, editTarget.id, payload);
        setMessage("FAQ berhasil diupdate.");
      } else {
        await createAdminFaq(token, payload);
        setMessage("FAQ berhasil disimpan.");
      }
      await refreshData();
      setForm(emptyForm);
      setIsDrawerOpen(false);
      setMessage("FAQ berhasil disimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "FAQ gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setError("");
    setMessage("");

    try {
      await deleteAdminFaq(token, deleteTarget.id);
      setFaqs((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("FAQ berhasil dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "FAQ gagal dihapus.");
    }
  }

  return (
    <>
      <section className="card-soft rounded-lg bg-white">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="label-caps mb-2 text-secondary">CMS FAQ</p>
              <h2 className="text-xl font-bold text-primary">Pertanyaan Umum</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary sm:w-64"
                  placeholder="Cari FAQ..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "active" | "inactive")
                }
                className="h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              >
                <option value="all">Semua</option>
                <option value="active">Ditampilkan</option>
                <option value="inactive">Disembunyikan</option>
              </select>

              <button
                type="button"
                onClick={refreshData}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
              >
                <Icon name="refresh" className="text-[20px]" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => openForm()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container"
              >
                <Icon name="add" className="text-[20px]" />
                Tambah FAQ
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-sm text-muted">Memuat data...</div>
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <article key={item.id} className="p-5 transition hover:bg-surface/70">
                <div className="grid gap-4 xl:grid-cols-[1fr_120px_48px] xl:items-start">
                  
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-success/10 text-success-strong' : 'bg-surface-container text-muted'}`}>
                        {item.is_active ? 'Ditampilkan' : 'Disembunyikan'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Q: {item.question}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                      <span className="font-bold text-secondary">A:</span> {item.answer}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold text-primary">
                      {item.sort_order || 0}
                    </p>
                    <p className="mt-1 text-muted">Urutan</p>
                  </div>

                  <div className="flex flex-col items-center gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openForm(item)}
                      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-primary/10 hover:text-primary"
                      aria-label={`Edit`}
                    >
                      <Icon name="edit" className="text-[20px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-secondary/10 hover:text-secondary"
                      aria-label={`Hapus`}
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8">
              <div className="flex max-w-xl gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                  <Icon name="help" className="text-[26px]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Belum ada FAQ</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Tambahkan pertanyaan dan jawaban yang sering ditanyakan untuk membantu pengunjung website.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container"
                  >
                    <Icon name="add" className="text-[20px]" />
                    Tambah FAQ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 grid lg:grid-cols-[1fr_520px]">
          <button
            type="button"
            className="hidden bg-primary/35 backdrop-blur-sm lg:block"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Tutup form"
          />
          <aside className="ml-auto flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-white shadow-[-18px_0_40px_rgba(15,23,42,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-white p-5">
              <div>
                <p className="label-caps mb-2 text-secondary">{editTarget ? "Edit FAQ" : "FAQ baru"}</p>
                <h2 className="text-2xl font-bold text-primary">{editTarget ? "Update FAQ" : "Tambah FAQ"}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-surface-container-low"
                aria-label="Tutup"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            {message ? (
              <div className="mx-5 mt-5 rounded-md bg-success/10 px-4 py-3 text-sm font-semibold text-success-strong">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="mx-5 mt-5 rounded-md bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <input
                value={form.question}
                onChange={(event) => setForm({ ...form, question: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                placeholder="Pertanyaan (Q)"
              />
              
              <textarea
                value={form.answer}
                onChange={(event) => setForm({ ...form, answer: event.target.value })}
                className="min-h-32 w-full rounded-md border border-border px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                placeholder="Jawaban (A)"
              />
              
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: parseInt(event.target.value) || 0 })}
                  className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="Urutan Tampil (contoh: 1)"
                />
                <label className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                  />
                  Tampilkan
                </label>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-muted"
              >
                <Icon name="save" className="text-[20px]" />
                {isSaving ? "Menyimpan..." : "Simpan FAQ"}
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-sm">
          <section className="card-soft w-full max-w-[420px] rounded-lg bg-white p-5">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <Icon name="warning" className="text-[26px]" />
            </div>
            <h2 className="text-xl font-bold text-primary">Hapus FAQ?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Pertanyaan <span className="font-semibold text-primary">{deleteTarget.question}</span> akan
              dihapus permanen dari CMS.
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
