"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AcademyManagedUser,
  AdminUser,
  createAkademiUser,
  deleteAkademiUser,
  getAkademiMe,
  getAkademiUsers,
  updateAkademiUser,
} from "../_lib/admin-api";
import { FormField, PageHeader, ResponsiveColumn, ResponsiveList, SheetModal } from "./ui";

const TOKEN_KEY = "skaihub_admin_token";

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: "ketua_akademi" | "admin_akademi" | "pelatih";
  is_active: boolean;
  is_coach: boolean;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "pelatih",
  is_active: true,
  is_coach: true,
};

const roleLabels: Record<AdminUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin Internal",
  ketua_akademi: "Ketua Akademi",
  admin_akademi: "Pengurus Akademi",
  pelatih: "Pelatih",
};

export default function AcademyUsersManager() {
  const tokenRef = useRef("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentRole, setCurrentRole] = useState<AdminUser["role"] | "">("");
  const [items, setItems] = useState<AcademyManagedUser[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editing, setEditing] = useState<AcademyManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManagePengurus = ["ketua_akademi", "admin_akademi"].includes(currentRole);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.name, item.email]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(keyword));
      const matchesRole =
        roleFilter === "all" ||
        item.role === roleFilter ||
        (roleFilter === "pelatih" && Boolean(item.coach_profile));
      return matchesKeyword && matchesRole;
    });
  }, [items, query, roleFilter]);

  async function loadData(activeToken: string) {
    const [profileData, userData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiUsers(activeToken),
    ]);

    setCurrentRole(profileData.user.role);
    setCurrentUserId(profileData.user.id);
    setItems(userData.data);
    setForm((current) => ({
      ...current,
      role: ["ketua_akademi", "admin_akademi"].includes(profileData.user.role)
        ? "admin_akademi"
        : "pelatih",
    }));
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

      loadData(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat akun akademi."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      role: canManagePengurus ? "admin_akademi" : "pelatih",
      is_coach: !canManagePengurus,
    });
    setIsFormOpen(false);
    setMessage("");
    setError("");
  }

  function openCreateModal() {
    setEditing(null);
    setForm({
      ...emptyForm,
      role: canManagePengurus ? "admin_akademi" : "pelatih",
      is_coach: !canManagePengurus,
    });
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function startEdit(item: AcademyManagedUser) {
    setEditing(item);
    setForm({
      name: item.name,
      email: item.email,
      password: "",
      role:
        item.role === "ketua_akademi"
          ? "ketua_akademi"
          : item.role === "admin_akademi"
          ? "admin_akademi"
          : "pelatih",
      is_active: item.is_active,
      is_coach: item.role === "pelatih" || Boolean(item.coach_profile),
    });
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function payloadFromForm() {
    return {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      is_active: form.is_active,
      is_coach: form.role === "pelatih" ? true : form.is_coach,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      if (editing) {
        const payload = payloadFromForm();
        await updateAkademiUser(tokenRef.current, editing.id, {
          ...payload,
          password: payload.password || undefined,
        });
      } else {
        await createAkademiUser(tokenRef.current, payloadFromForm());
      }

      await loadData(tokenRef.current);
      resetForm();
      setMessage(editing ? "Akun diperbarui." : "Akun ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan akun.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(item: AcademyManagedUser) {
    if (item.id === currentUserId) {
      setError("Akun sendiri tidak bisa dinonaktifkan.");
      return;
    }

    const confirmed = window.confirm(`Nonaktifkan akun ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiUser(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Akun dinonaktifkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menonaktifkan akun.");
    } finally {
      setIsSaving(false);
    }
  }

  const columns: ResponsiveColumn<AcademyManagedUser>[] = [
    {
      key: "name",
      header: "Akun",
      primary: true,
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{item.name}</span>
            {item.id === currentUserId ? (
              <span className="bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Akun saya
              </span>
            ) : null}
          </div>
          <span className="block text-xs font-medium text-muted">{item.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Jenis Akun",
      render: (item) => (
        <div>
          <span className="font-medium text-primary">{roleLabels[item.role] || item.role}</span>
          {item.coach_profile ? (
            <span className="mt-0.5 block text-xs font-bold text-secondary">Juga pelatih</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
            item.is_active ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"
          }`}
        >
          {item.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      headerClassName: "text-right",
      className: "text-right",
      render: (item: AcademyManagedUser) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startEdit(item)}
            className="inline-flex min-h-11 items-center justify-center border border-border px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            Edit
          </button>
          {item.is_active && item.id !== currentUserId ? (
            <button
              type="button"
              onClick={() => handleDeactivate(item)}
              className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary/20"
            >
              Nonaktifkan
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat akun akademi...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akses Akademi"
        title="Akun Operasional"
        description="Kelola akun login untuk pengurus dan pelatih yang berhak mengakses sistem akademi."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-xs transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary/50 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Tambah Akun
          </button>
        }
      />

      {message ? (
        <p className="border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <label htmlFor="users-search" className="sr-only">
              Cari akun
            </label>
            <input
              id="users-search"
              className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              placeholder="Cari nama atau email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <label htmlFor="users-role-filter" className="sr-only">
              Filter role
            </label>
            <select
              id="users-role-filter"
              className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-sm text-primary transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Semua role</option>
              {canManagePengurus ? <option value="admin_akademi">Pengurus Akademi</option> : null}
              <option value="pelatih">Pelatih</option>
            </select>
          </div>
        </div>
      </div>

      <ResponsiveList
        columns={columns}
        rows={filteredItems}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar akun operasional akademi"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            {query || roleFilter !== "all"
              ? "Tidak ada akun yang sesuai dengan filter."
              : "Belum ada akun yang bisa dikelola."}
          </div>
        }
      />

      <SheetModal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={editing ? "Edit Akun" : "Tambah Akun"}
        description={
          editing
            ? `Perbarui akses akun untuk ${editing.name}`
            : "Tambahkan akun login baru untuk pengurus atau pelatih."
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="user-name"
            label="Nama Lengkap"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Contoh: Sabeum Hartono"
          />

          <FormField
            id="user-email"
            label="Email Login"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="nama@email.com"
          />

          <FormField
            id="user-password"
            label="Password"
            type="password"
            required={!editing}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
            hint={
              editing
                ? "Isi password baru hanya jika ingin mereset password akun ini."
                : undefined
            }
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-role" className="text-xs font-bold uppercase tracking-wide text-primary">
              Jenis Akun
            </label>
            {canManagePengurus && form.role !== "ketua_akademi" ? (
              <select
                id="user-role"
                className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
                value={form.role}
                onChange={(event) => {
                  const nextRole = event.target.value as UserForm["role"];
                  setForm((current) => ({
                    ...current,
                    role: nextRole,
                    is_coach: nextRole === "pelatih" ? true : current.is_coach,
                  }));
                }}
              >
                <option value="admin_akademi">Pengurus Akademi</option>
                <option value="pelatih">Pelatih</option>
              </select>
            ) : (
              <div className="flex min-h-11 items-center border border-border bg-surface-container px-3.5 text-sm font-medium text-muted">
                {roleLabels[form.role] || form.role}
              </div>
            )}
          </div>

          {form.role !== "pelatih" ? (
            <label className="flex items-start gap-3 border border-border bg-surface-container-low p-3 text-sm font-semibold text-primary">
              <input
                className="mt-1 size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary/20"
                type="checkbox"
                checked={form.is_coach}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_coach: event.target.checked }))
                }
              />
              <span>
                Juga sebagai pelatih
                <span className="block text-xs font-medium leading-5 text-muted">
                  Akun ini punya akses {roleLabels[form.role]}, sekaligus tercatat di daftar pelatih.
                </span>
              </span>
            </label>
          ) : null}

          <label className="flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              className="size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary/20"
              checked={form.is_active}
              disabled={editing?.id === currentUserId}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            <span>Akun aktif</span>
          </label>
          {editing?.id === currentUserId ? (
            <p className="text-xs font-medium text-muted">
              Akun yang sedang digunakan login tidak bisa dinonaktifkan sendiri.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              onClick={resetForm}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              disabled={isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </SheetModal>
    </div>
  );
}
