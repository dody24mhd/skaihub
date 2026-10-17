"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminAkademi,
  AdminAkademiDetailResponse,
  AkademiPayload,
  AkademiPlan,
  AkademiStatus,
  SubscriptionDuration,
  createAdminAkademi,
  deleteAdminAkademi,
  getAdminAkademiDetail,
  getAdminAkademi,
  updateAdminAkademi,
  uploadAdminImage,
} from "../_lib/admin-api";
import { defaultRankSystemForSport, rankSystemLabel } from "../_lib/rank-systems";
import RankSystemSelect from "./akademi/rank-system-select";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const emptyCreateForm: AkademiPayload = {
  name: "",
  slug: "",
  sport_type: "taekwondo",
  rank_system: "taekwondo_kukkiwon",
  logo_url: "",
  plan: "starter",
  duration_type: "monthly",
  plan_expires_at: "",
  extra_student_blocks: 0,
  payment_status: "unpaid",
  ketua_name: "",
  ketua_email: "",
  ketua_password: "",
  admin_name: "",
  admin_email: "",
  admin_password: "",
};

const statusLabels: Record<AkademiStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  suspended: "Suspended",
};

const planLabels: Record<AkademiPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

const planDetails: Record<AkademiPlan, { access: string; quota: string }> = {
  starter: {
    access: "app.skaihub.com",
    quota: "50 siswa aktif",
  },
  pro: {
    access: "Subdomain aktif",
    quota: "150 siswa aktif",
  },
  scale: {
    access: "Subdomain aktif",
    quota: "300 siswa aktif",
  },
};

const durationLabels: Record<SubscriptionDuration, string> = {
  trial: "Trial 14 hari",
  monthly: "1 bulan",
  quarterly: "3 bulan",
  semester: "6 bulan",
  yearly: "12 bulan",
  custom: "Custom tanggal",
};

const sportOptions = [
  { value: "taekwondo", label: "Taekwondo" },
  { value: "karate", label: "Karate" },
  { value: "pencak_silat", label: "Pencak Silat" },
  { value: "judo", label: "Judo" },
  { value: "mixed_martial_arts", label: "Mixed Martial Arts" },
  { value: "lainnya", label: "Lainnya" },
];

function statusClass(status: AkademiStatus) {
  if (status === "active") return "bg-success/10 text-success-strong";
  if (status === "suspended") return "bg-secondary/10 text-secondary";
  return "bg-surface-container text-muted";
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);

  if (next.getDate() !== day) {
    next.setDate(0);
  }

  return next;
}

function subscriptionEndDate(duration: SubscriptionDuration, customDate?: string | null) {
  const start = new Date();

  if (duration === "trial") {
    const next = new Date(start);
    next.setDate(next.getDate() + 14);
    return next;
  }

  if (duration === "monthly") return addMonths(start, 1);
  if (duration === "quarterly") return addMonths(start, 3);
  if (duration === "semester") return addMonths(start, 6);
  if (duration === "yearly") return addMonths(start, 12);
  if (customDate) return new Date(`${customDate}T00:00:00`);

  return null;
}

function formatDateId(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AdminAkademiManager() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<AdminAkademi[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AkademiStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | AkademiPlan>("all");
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [isCreateSlugEdited, setIsCreateSlugEdited] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminAkademi | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminAkademiDetailResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAkademi | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUploadingCreateLogo, setIsUploadingCreateLogo] = useState(false);
  const [isUploadingEditLogo, setIsUploadingEditLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword) ||
        item.sport_type.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesPlan = planFilter === "all" || item.plan === planFilter;

      return matchesQuery && matchesStatus && matchesPlan;
    });
  }, [items, planFilter, query, statusFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Total Akademi",
        value: String(items.length),
        icon: "domain",
      },
      {
        label: "Aktif",
        value: String(items.filter((item) => item.status === "active").length),
        icon: "verified",
      },
      {
        label: "Pro/Scale",
        value: String(items.filter((item) => item.plan !== "starter").length),
        icon: "workspace_premium",
      },
      {
        label: "User Terdaftar",
        value: String(
          items.reduce((total, item) => total + Number(item.users_count || 0), 0),
        ),
        icon: "groups",
      },
    ],
    [items],
  );

  const canCreate = useMemo(() => {
    const hasAdminDraft = Boolean(
      createForm.admin_name.trim() ||
        createForm.admin_email.trim() ||
        createForm.admin_password.trim(),
    );
    const adminReady =
      createForm.admin_name.trim().length > 2 &&
      createForm.admin_email.trim().length > 5 &&
      createForm.admin_password.trim().length >= 8;

    return (
      createForm.name.trim().length > 2 &&
      createForm.ketua_name.trim().length > 2 &&
      createForm.ketua_email.trim().length > 5 &&
      createForm.ketua_password.trim().length >= 8 &&
      (!hasAdminDraft || adminReady) &&
      (createForm.duration_type !== "custom" || Boolean(createForm.plan_expires_at))
    );
  }, [createForm]);
  const selectedCreatePlan = createForm.plan || "starter";
  const selectedCreateDuration = createForm.duration_type || "monthly";
  const createSubscriptionEndsAt = subscriptionEndDate(
    selectedCreateDuration,
    createForm.plan_expires_at,
  );

  async function refreshList(savedToken = token) {
    if (!savedToken) return;

    setError("");
    const data = await getAdminAkademi(savedToken);
    setItems(data);
  }

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login sebagai super admin dulu untuk membuka data akademi.");
        return;
      }

      getAdminAkademi(savedToken)
        .then(setItems)
        .catch((caught: Error) => setError(caught.message))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function updateCreateForm(key: keyof AkademiPayload, value: string) {
    setCreateForm((current) => {
      if (key === "name") {
        return {
          ...current,
          name: value,
          slug: isCreateSlugEdited ? current.slug : makeSlug(value),
        };
      }

      if (key === "sport_type") {
        return { ...current, sport_type: value, rank_system: defaultRankSystemForSport(value) };
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function updateCreateSlug(value: string) {
    setIsCreateSlugEdited(true);
    setCreateForm((current) => ({
      ...current,
      slug: makeSlug(value),
    }));
  }

  async function handleCreateLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCreateLogo(true);
    setError("");

    try {
      const data = await uploadAdminImage(token, file);
      setCreateForm((current) => ({
        ...current,
        logo_url: data.url,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Logo gagal diunggah.");
    } finally {
      setIsUploadingCreateLogo(false);
      event.target.value = "";
    }
  }

  async function handleEditLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editTarget) return;

    setIsUploadingEditLogo(true);
    setError("");

    try {
      const data = await uploadAdminImage(token, file);
      setEditTarget((current) => (current ? { ...current, logo_url: data.url } : current));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Logo gagal diunggah.");
    } finally {
      setIsUploadingEditLogo(false);
      event.target.value = "";
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate) {
      setError("Nama akademi, akun ketua, dan password ketua minimal 8 karakter wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const payload: AkademiPayload = {
      ...createForm,
      name: createForm.name.trim(),
      slug: createForm.slug?.trim() || undefined,
      sport_type: createForm.sport_type?.trim() || "taekwondo",
      logo_url: createForm.logo_url?.trim() || null,
      plan_expires_at: createForm.plan_expires_at || null,
      ketua_name: createForm.ketua_name.trim(),
      ketua_email: createForm.ketua_email.trim(),
      ketua_password: createForm.ketua_password,
      admin_name: createForm.admin_name.trim(),
      admin_email: createForm.admin_email.trim(),
      admin_password: createForm.admin_password,
    };

    try {
      await createAdminAkademi(token, payload);
      await refreshList();
      setCreateForm(emptyCreateForm);
      setIsCreateSlugEdited(false);
      setIsCreateOpen(false);
      setMessage("Akademi dan akun awal berhasil dibuat.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Akademi gagal dibuat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await updateAdminAkademi(token, editTarget.id, {
        name: editTarget.name.trim(),
        slug: editTarget.slug.trim(),
        sport_type: editTarget.sport_type.trim(),
        rank_system: editTarget.rank_system ?? null,
        logo_url: editTarget.logo_url?.trim() || null,
        status: editTarget.status,
      });
      await refreshList();
      setEditTarget(null);
      setMessage("Data akademi berhasil diupdate.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Akademi gagal diupdate.");
    } finally {
      setIsSaving(false);
    }
  }

  async function openDetail(item: AdminAkademi) {
    setIsLoadingDetail(true);
    setError("");

    try {
      const data = await getAdminAkademiDetail(token, item.id);
      setDetailTarget(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Detail akademi gagal dimuat.");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setError("");
    setMessage("");

    try {
      await deleteAdminAkademi(token, deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("Akademi berhasil dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Akademi gagal dihapus.");
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
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

      {message ? (
        <div className="mb-5 rounded-md bg-success/10 px-4 py-3 text-sm font-semibold text-success-strong">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-md bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary">
          {error}
        </div>
      ) : null}

      <section className="card-soft rounded-lg bg-white">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="label-caps mb-2 text-secondary">Platform</p>
              <h2 className="text-xl font-bold text-primary">Daftar Akademi</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary sm:w-64"
                  placeholder="Cari akademi"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AkademiStatus)
                }
                className="h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={planFilter}
                onChange={(event) =>
                  setPlanFilter(event.target.value as "all" | AkademiPlan)
                }
                className="h-10 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              >
                <option value="all">Semua paket</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="scale">Scale</option>
              </select>

              <button
                type="button"
                onClick={() => refreshList()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
              >
                <Icon name="refresh" className="text-[20px]" />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container"
              >
                <Icon name="add_business" className="text-[20px]" />
                Tambah Akademi
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="px-5 py-3">Akademi</th>
                <th className="px-5 py-3">Paket</th>
                <th className="px-5 py-3">Akses</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Berakhir</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-muted">
                    Memuat akademi...
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-surface/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        {item.slug}.skaihub.com / {item.sport_type}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {planLabels[item.plan]}
                      <span className="mt-1 block text-xs font-medium text-muted">
                        {planDetails[item.plan].quota}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {item.plan === "starter" ? "Aplikasi pusat" : "Subdomain"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">{item.users_count || 0}</td>
                    <td className="px-5 py-4 text-muted">
                      {formatDate(item.plan_expires_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-success/10 hover:text-success-strong"
                          aria-label={`Detail ${item.name}`}
                          disabled={isLoadingDetail}
                        >
                          <Icon name="visibility" className="text-[20px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget(item)}
                          className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-primary/10 hover:text-primary"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Icon name="edit" className="text-[20px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex size-10 items-center justify-center rounded-md text-muted transition hover:bg-secondary/10 hover:text-secondary"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Icon name="delete" className="text-[20px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8">
                    <div className="flex max-w-xl gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                        <Icon name="domain_disabled" className="text-[26px]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary">
                          Belum ada akademi
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          Tambahkan unit pertama untuk mulai mengelola tenant
                          platform SKAIHUB.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid lg:grid-cols-[1fr_560px]">
          <button
            type="button"
            className="hidden bg-primary/35 backdrop-blur-sm lg:block"
            onClick={() => setIsCreateOpen(false)}
            aria-label="Tutup form"
          />
          <aside className="ml-auto flex h-full w-full max-w-[600px] flex-col overflow-y-auto bg-white shadow-[-18px_0_40px_rgba(15,23,42,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-white p-5">
              <div>
                <p className="label-caps mb-2 text-secondary">Akademi baru</p>
                <h2 className="text-2xl font-bold text-primary">Tambah Akademi</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                  Lengkapi identitas akademi dan admin pertama untuk mulai mengaktifkan akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-surface-container-low"
                aria-label="Tutup"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <input
                value={createForm.name}
                onChange={(event) => updateCreateForm("name", event.target.value)}
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                placeholder="Nama akademi"
              />
              <div className="rounded-md border border-border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-container-low">
                    {createForm.logo_url ? (
                      <div
                        aria-label="Logo akademi"
                        role="img"
                        className="size-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${createForm.logo_url})` }}
                      />
                    ) : (
                      <Icon name="image" className="text-[28px] text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="label-caps mb-2 text-muted">Logo Akademi</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary transition hover:bg-surface-container-low">
                        <Icon name="upload" className="text-[20px]" />
                        {isUploadingCreateLogo ? "Mengunggah..." : "Upload logo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleCreateLogoUpload}
                          disabled={isUploadingCreateLogo}
                          className="sr-only"
                        />
                      </label>
                      {createForm.logo_url ? (
                        <button
                          type="button"
                          onClick={() => updateCreateForm("logo_url", "")}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-muted transition hover:bg-surface-container-low"
                        >
                          <Icon name="delete" className="text-[20px]" />
                          Hapus
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      PNG, JPG, atau WEBP. Maksimal 5MB.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">Cabang olahraga</span>
                  <select
                    value={createForm.sport_type}
                    onChange={(event) => updateCreateForm("sport_type", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  >
                    {sportOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <RankSystemSelect
                  id="create-rank-system"
                  sportType={createForm.sport_type ?? "taekwondo"}
                  value={createForm.rank_system}
                  onChange={(value) => updateCreateForm("rank_system", value)}
                />
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">Durasi Langganan</span>
                  <select
                    value={selectedCreateDuration}
                    onChange={(event) =>
                      updateCreateForm("duration_type", event.target.value as SubscriptionDuration)
                    }
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  >
                    {Object.entries(durationLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selectedCreateDuration === "custom" ? (
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">
                    Tanggal akhir langganan
                  </span>
                  <input
                    type="date"
                    value={createForm.plan_expires_at || ""}
                    onChange={(event) => updateCreateForm("plan_expires_at", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  />
                </label>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">Paket</span>
                  <select
                    value={selectedCreatePlan}
                    onChange={(event) =>
                      updateCreateForm("plan", event.target.value as AkademiPlan)
                    }
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="scale">Scale</option>
                  </select>
                </label>
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">
                    {selectedCreatePlan === "starter" ? "Kode Akademi" : "Subdomain Akademi"}
                  </span>
                  <div
                    className={`flex h-11 items-center rounded-md border border-border px-3 text-sm outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary ${
                      selectedCreatePlan === "starter" ? "bg-surface-container-low" : "bg-white"
                    }`}
                  >
                    <input
                      value={createForm.slug}
                      onChange={(event) => updateCreateSlug(event.target.value)}
                      readOnly={selectedCreatePlan === "starter"}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
                      placeholder={
                        selectedCreatePlan === "starter"
                          ? "otomatis dari nama akademi"
                          : "nama-akademi"
                      }
                    />
                    {selectedCreatePlan !== "starter" ? (
                      <span className="shrink-0 pl-1 text-muted">.skaihub.com</span>
                    ) : null}
                  </div>
                </label>
              </div>
              <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
                <span className="font-semibold text-primary">
                  {planLabels[selectedCreatePlan]}:{" "}
                </span>
                {planDetails[selectedCreatePlan].quota}.{" "}
                {selectedCreatePlan === "starter"
                  ? `Kode ${createForm.slug || "nama-akademi"} dipakai internal; akademi login lewat app.skaihub.com.`
                  : `Subdomain aktif: ${createForm.slug || "nama-akademi"}.skaihub.com.`}
                <br />
                Masa aktif awal: {durationLabels[selectedCreateDuration]}, sampai{" "}
                {formatDateId(createSubscriptionEndsAt)}.
              </div>

              <div className="rounded-md border border-border p-4">
                <p className="label-caps mb-3 text-secondary">Ketua akademi</p>
                <div className="space-y-3">
                  <input
                    value={createForm.ketua_name}
                    onChange={(event) => updateCreateForm("ketua_name", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Nama ketua akademi"
                  />
                  <input
                    type="email"
                    value={createForm.ketua_email}
                    onChange={(event) => updateCreateForm("ketua_email", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Email ketua"
                  />
                  <input
                    type="password"
                    value={createForm.ketua_password}
                    onChange={(event) => updateCreateForm("ketua_password", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Password sementara minimal 8 karakter"
                  />
                </div>
              </div>

              <div className="rounded-md border border-border p-4">
                <p className="label-caps mb-1 text-secondary">Admin pertama</p>
                <p className="mb-3 text-sm leading-6 text-muted">
                  Opsional saat onboarding. Isi lengkap jika operasional langsung didelegasikan.
                </p>
                <div className="space-y-3">
                  <input
                    value={createForm.admin_name}
                    onChange={(event) => updateCreateForm("admin_name", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Nama admin akademi"
                  />
                  <input
                    type="email"
                    value={createForm.admin_email}
                    onChange={(event) => updateCreateForm("admin_email", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Email admin"
                  />
                  <input
                    type="password"
                    value={createForm.admin_password}
                    onChange={(event) => updateCreateForm("admin_password", event.target.value)}
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Password admin minimal 8 karakter"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!canCreate || isSaving || isUploadingCreateLogo}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-muted"
              >
                <Icon name="save" className="text-[20px]" />
                {isSaving ? "Menyimpan..." : "Buat Akademi"}
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      {editTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-sm">
          <section className="card-soft w-full max-w-[560px] rounded-lg bg-white p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="label-caps mb-2 text-secondary">Edit akademi</p>
                <h2 className="text-xl font-bold text-primary">{editTarget.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-surface-container-low"
                aria-label="Tutup"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                value={editTarget.name}
                onChange={(event) =>
                  setEditTarget({ ...editTarget, name: event.target.value })
                }
                className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={editTarget.slug}
                  onChange={(event) =>
                    setEditTarget({ ...editTarget, slug: makeSlug(event.target.value) })
                  }
                  readOnly={editTarget.plan === "starter"}
                  className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
                <select
                  value={editTarget.sport_type}
                  onChange={(event) =>
                    setEditTarget({
                      ...editTarget,
                      sport_type: event.target.value,
                      rank_system: defaultRankSystemForSport(event.target.value),
                    })
                  }
                  className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  {sportOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <RankSystemSelect
                id="edit-rank-system"
                sportType={editTarget.sport_type}
                value={editTarget.rank_system}
                onChange={(value) => setEditTarget({ ...editTarget, rank_system: value })}
              />
              <div className="rounded-md border border-border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-container-low">
                    {editTarget.logo_url ? (
                      <div
                        aria-label="Logo akademi"
                        role="img"
                        className="size-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${editTarget.logo_url})` }}
                      />
                    ) : (
                      <Icon name="image" className="text-[28px] text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="label-caps mb-2 text-muted">Logo Akademi</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary transition hover:bg-surface-container-low">
                        <Icon name="upload" className="text-[20px]" />
                        {isUploadingEditLogo ? "Mengunggah..." : "Upload logo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleEditLogoUpload}
                          disabled={isUploadingEditLogo}
                          className="sr-only"
                        />
                      </label>
                      {editTarget.logo_url ? (
                        <button
                          type="button"
                          onClick={() => setEditTarget({ ...editTarget, logo_url: null })}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-muted transition hover:bg-surface-container-low"
                        >
                          <Icon name="delete" className="text-[20px]" />
                          Hapus
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      PNG, JPG, atau WEBP. Maksimal 5MB.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                <label className="block">
                  <span className="label-caps mb-2 block text-muted">Status Akademi</span>
                  <select
                    value={editTarget.status}
                    onChange={(event) =>
                      setEditTarget({
                        ...editTarget,
                        status: event.target.value as AkademiStatus,
                      })
                    }
                    className="h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
                  <p className="label-caps mb-1 text-muted">Langganan Aktif</p>
                  <p>
                    <span className="font-semibold text-primary">
                      {planLabels[editTarget.plan]}
                    </span>{" "}
                    sampai {formatDate(editTarget.plan_expires_at)}
                  </p>
                  <Link
                    href="/internal/subscription"
                    className="mt-2 inline-flex text-sm font-semibold text-secondary transition hover:text-secondary-dark"
                  >
                    Kelola paket di menu Langganan
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingEditLogo}
                  className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-muted"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {detailTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-sm">
          <section className="card-soft max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-lg bg-white p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-container-low">
                  {detailTarget.akademi.logo_url ? (
                    <div
                      aria-label="Logo akademi"
                      role="img"
                      className="size-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${detailTarget.akademi.logo_url})` }}
                    />
                  ) : (
                    <Icon name="domain" className="text-[28px] text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="label-caps mb-1 text-secondary">Detail akademi</p>
                  <h2 className="truncate text-xl font-bold text-primary">
                    {detailTarget.akademi.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {detailTarget.akademi.slug}.skaihub.com /{" "}
                    {detailTarget.akademi.sport_type} · {rankSystemLabel(detailTarget.akademi.rank_system)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-surface-container-low"
                aria-label="Tutup"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total User", detailTarget.akademi.users_count || 0],
                ["Ketua", detailTarget.akademi.ketua_akademi_count || 0],
                ["Admin", detailTarget.akademi.admin_akademi_count || 0],
                ["Pelatih", detailTarget.akademi.pelatih_count || 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-surface px-4 py-3">
                  <p className="text-xs font-bold uppercase text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <p className="label-caps mb-3 text-secondary">Profil</p>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Status</dt>
                    <dd className="font-semibold text-primary">
                      {statusLabels[detailTarget.akademi.status]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Paket snapshot</dt>
                    <dd className="font-semibold text-primary">
                      {planLabels[detailTarget.akademi.plan]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Aktif sampai</dt>
                    <dd className="font-semibold text-primary">
                      {formatDate(detailTarget.akademi.plan_expires_at)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Akses</dt>
                    <dd className="font-semibold text-primary">
                      {detailTarget.akademi.plan === "starter"
                        ? "app.skaihub.com"
                        : `${detailTarget.akademi.slug}.skaihub.com`}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-md border border-border p-4">
                <p className="label-caps mb-3 text-secondary">Langganan Aktif</p>
                {detailTarget.subscription ? (
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Status</dt>
                      <dd className="font-semibold text-primary">
                        {detailTarget.subscription.status}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Kuota siswa</dt>
                      <dd className="font-semibold text-primary">
                        {detailTarget.entitlements.student_limit}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Add-on</dt>
                      <dd className="font-semibold text-primary">
                        {detailTarget.subscription.extra_student_blocks} blok
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Pembayaran</dt>
                      <dd className="font-semibold text-primary">
                        {detailTarget.subscription.payment_status}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Nominal</dt>
                      <dd className="font-semibold text-primary">
                        {formatMoney(detailTarget.subscription.amount)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Belum ada subscription aktif untuk akademi ini.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-border p-4">
              <p className="label-caps mb-3 text-secondary">User Akademi</p>
              {detailTarget.akademi.users?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs uppercase text-muted">
                      <tr>
                        <th className="py-2 pr-4">Nama</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detailTarget.akademi.users.map((user) => (
                        <tr key={user.id}>
                          <td className="py-3 pr-4 font-semibold text-primary">{user.name}</td>
                          <td className="py-3 pr-4 text-muted">{user.email}</td>
                          <td className="py-3 pr-4 text-muted">{user.role}</td>
                          <td className="py-3 text-right text-muted">
                            {user.is_active ? "Aktif" : "Nonaktif"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">Belum ada user.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/35 px-5 backdrop-blur-sm">
          <section className="card-soft w-full max-w-[420px] rounded-lg bg-white p-5">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <Icon name="warning" className="text-[26px]" />
            </div>
            <h2 className="text-xl font-bold text-primary">Hapus akademi?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Akademi <span className="font-semibold text-primary">{deleteTarget.name}</span>{" "}
              akan dihapus dari daftar platform.
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
