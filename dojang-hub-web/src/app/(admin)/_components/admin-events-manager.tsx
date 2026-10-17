"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminEvent,
  createAdminEvent,
  deleteAdminEvent,
  EventPayload,
  getAdminEvents,
  uploadAdminImage,
  updateAdminEvent,
} from "../_lib/admin-api";
import { RichTextEditor } from "./rich-text-editor";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const emptyForm = {
  title: "",
  excerpt: "",
  description: "",
  location: "",
  organizer_name: "",
  registration_url: "",
  cover_image_url: "",
  starts_at: "",
  ends_at: "",
  category: "Umum",
  status: "draft" as EventPayload["status"],
  is_featured: false,
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(value));
}

function formatEventRange(start: string, end?: string | null) {
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function statusClass(status: AdminEvent["status"]) {
  if (status === "published") return "bg-success/10 text-success-strong";
  if (status === "cancelled") return "bg-secondary/10 text-secondary";
  return "bg-surface-container text-muted";
}

function statusLabel(status: AdminEvent["status"]) {
  if (status === "published") return "Published";
  if (status === "cancelled") return "Cancelled";
  return "Draft";
}

export default function AdminEventsManager() {
  const [token, setToken] = useState("");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminEvent["status"]>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [editTarget, setEditTarget] = useState<AdminEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => form.title.trim().length > 2 && form.starts_at.length > 0 && token,
    [form.starts_at, form.title, token],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const keyword = query.trim().toLowerCase();
      const matchesQuery =
        !keyword ||
        event.title.toLowerCase().includes(keyword) ||
        event.location?.toLowerCase().includes(keyword) ||
        event.organizer_name?.toLowerCase().includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [events, query, statusFilter]);

  const eventStats = useMemo(
    () => [
      {
        label: "Total",
        value: String(events.length),
        icon: "event_note",
      },
      {
        label: "Published",
        value: String(events.filter((event) => event.status === "published").length),
        icon: "event_available",
      },
      {
        label: "Draft",
        value: String(events.filter((event) => event.status === "draft").length),
        icon: "edit_calendar",
      },
      {
        label: "Pinned",
        value: String(events.filter((event) => event.is_featured).length),
        icon: "push_pin",
      },
    ],
    [events],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login admin dulu untuk membuka data event.");
        return;
      }

      getAdminEvents(savedToken)
        .then(setEvents)
        .catch((caught: Error) => setError(caught.message))
        .finally(() => setIsLoading(false));
    });
  }, []);

  async function refreshEvents() {
    if (!token) return;

    setError("");
    const data = await getAdminEvents(token);
    setEvents(data);
  }

  function openForm(event?: AdminEvent) {
    if (event) {
      setEditTarget(event);
      setForm({
        title: event.title,
        excerpt: event.excerpt || "",
        description: event.description || "",
        cover_image_url: event.cover_image_url || "",
        location: event.location || "",
        organizer_name: event.organizer_name || "",
        registration_url: event.registration_url || "",
        category: event.category || "Umum",
        status: event.status,
        is_featured: event.is_featured,
        starts_at: new Date(event.starts_at).toISOString().slice(0, 10),
        ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 10) : "",
      });
    } else {
      setEditTarget(null);
      setForm(emptyForm);
    }
    setMessage("");
    setError("");
    setIsDrawerOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setError("");

    try {
      const result = await uploadAdminImage(token, file);
      setForm((prev) => ({ ...prev, cover_image_url: result.url }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Judul dan tanggal mulai wajib diisi.");
      return;
    }

    const payload: EventPayload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || undefined,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      organizer_name: form.organizer_name.trim() || undefined,
      registration_url: form.registration_url.trim() || undefined,
      category: form.category,
      cover_image_url: form.cover_image_url.trim() || undefined,
      starts_at: form.starts_at,
      ends_at: form.ends_at || undefined,
      status: form.status,
      is_featured: form.is_featured,
      published_at: form.status === "published" ? new Date().toISOString() : undefined,
    };

    setIsSaving(true);

    try {
      if (editTarget) {
        await updateAdminEvent(token, editTarget.id, payload);
        setMessage("Event berhasil diupdate.");
      } else {
        await createAdminEvent(token, payload);
        setMessage("Event berhasil disimpan.");
      }
      await refreshEvents();
      setForm(emptyForm);
      setIsDrawerOpen(false);
      setMessage("Event berhasil disimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Event gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setError("");
    setMessage("");

    try {
      await deleteAdminEvent(token, deleteTarget.id);
      setEvents((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("Event berhasil dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Event gagal dihapus.");
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {eventStats.map((item) => (
          <article key={item.label} className="card-soft rounded-lg bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">{item.label}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-primary">
                  {item.value}
                </p>
              </div>
              <Icon name={item.icon} className="text-[26px] text-secondary" />
            </div>
          </article>
        ))}
      </div>

      <section className="card-soft rounded-lg bg-white">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="label-caps mb-2 text-secondary">CMS Event</p>
              <h2 className="text-xl font-bold text-primary">Daftar Agenda</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-64"
                  placeholder="Cari event"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AdminEvent["status"])
                }
                className="h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Semua status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={refreshEvents}
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
                Tambah Event
              </button>
            </div>
          </div>
        </div>



        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-sm text-muted">Memuat event...</div>
          ) : filteredEvents.length ? (
            filteredEvents.map((event) => (
              <article key={event.id} className="p-5 transition hover:bg-surface/70">
                <div className="grid gap-4 xl:grid-cols-[1fr_160px_120px_100px_96px] xl:items-center">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(event.status)}`}>
                        {statusLabel(event.status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted border border-border">
                        {event.category}
                      </span>
                      {event.is_featured ? (
                        <span className="rounded-full bg-belt-yellow/20 px-3 py-1 text-xs font-semibold text-primary">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-primary">{event.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                      {event.excerpt || event.description || "Belum ada ringkasan."}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold text-primary">{formatEventRange(event.starts_at, event.ends_at)}</p>
                    <p className="mt-1 text-muted">{event.location || "Lokasi belum diisi"}</p>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold text-primary">
                      {event.organizer_name || "SKAIHUB"}
                    </p>
                    <p className="mt-1 text-muted">Penyelenggara</p>
                  </div>

                  <div className="text-sm text-success-strong flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Icon name="visibility" className="text-[18px]" />
                      {event.views_count || 0}
                    </div>
                    <p className="text-muted text-xs font-semibold uppercase tracking-widest">Views</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(event)}
                      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-primary/10 hover:text-primary"
                      aria-label={`Edit ${event.title}`}
                    >
                      <Icon name="edit" className="text-[20px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(event)}
                      className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-secondary/10 hover:text-secondary"
                      aria-label={`Hapus ${event.title}`}
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
                  <Icon name="event_busy" className="text-[26px]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Belum ada event</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Tambahkan agenda pertama untuk mulai mengisi kanal event di
                    website SKAIHUB.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container"
                  >
                    <Icon name="add" className="text-[20px]" />
                    Tambah Event
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
                <p className="label-caps mb-2 text-secondary">{editTarget ? "Edit Event" : "Agenda baru"}</p>
                <h2 className="text-2xl font-bold text-primary">{editTarget ? "Update Event" : "Tambah Event"}</h2>
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
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Judul event"
              />
              <input
                value={form.excerpt}
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Label / Ringkasan Singkat"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">Mulai Pelaksanaan</label>
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">Selesai (Opsional)</label>
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Lokasi"
              />
              <input
                value={form.organizer_name}
                onChange={(event) => setForm({ ...form, organizer_name: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Penyelenggara"
              />
              <input
                value={form.registration_url}
                onChange={(event) => setForm({ ...form, registration_url: event.target.value })}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Link pendaftaran / proposal (opsional)"
              />
              <div className="rounded-md border border-border p-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">
                  Poster Event
                </label>
                {form.cover_image_url ? (
                  <div className="mb-3 relative group w-full max-w-[200px] overflow-hidden rounded border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.cover_image_url} alt="Poster" className="w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Hapus poster"
                      onClick={() => setForm({ ...form, cover_image_url: "" })}
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md bg-white text-secondary opacity-0 shadow transition group-hover:opacity-100 hover:bg-secondary/10"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="block w-full text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  {isUploading && <span className="text-sm text-muted">Mengunggah...</span>}
                </div>
              </div>
              <div className="w-full overflow-hidden rounded-md border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Deskripsi event"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="grid gap-3 grid-cols-2">
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="Umum">Umum</option>
                    <option value="Taekwondo">Taekwondo</option>
                    <option value="Karate">Karate</option>
                  </select>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as EventPayload["status"] })
                    }
                    className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <label className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                  />
                  Pin
                </label>
              </div>
              <button
                type="submit"
                disabled={!canSubmit || isSaving || isUploading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-muted"
              >
                <Icon name="save" className="text-[20px]" />
                {isSaving ? "Menyimpan..." : "Simpan Event"}
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
            <h2 className="text-xl font-bold text-primary">Hapus event?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Event <span className="font-semibold text-primary">{deleteTarget.title}</span> akan
              dihapus dari CMS.
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
