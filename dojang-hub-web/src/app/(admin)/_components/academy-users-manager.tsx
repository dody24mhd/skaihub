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
      const matchesKeyword = !keyword || [item.name, item.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword));
      const matchesRole = roleFilter === "all"
        || item.role === roleFilter
        || (roleFilter === "pelatih" && Boolean(item.coach_profile));
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
      role: ["ketua_akademi", "admin_akademi"].includes(profileData.user.role) ? "admin_akademi" : "pelatih",
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
    setMessage("");
    setError("");
  }

  function startEdit(item: AcademyManagedUser) {
    setEditing(item);
    setForm({
      name: item.name,
      email: item.email,
      password: "",
      role: item.role === "ketua_akademi" ? "ketua_akademi" : item.role === "admin_akademi" ? "admin_akademi" : "pelatih",
      is_active: item.is_active,
      is_coach: item.role === "pelatih" || Boolean(item.coach_profile),
    });
    setMessage("");
    setError("");
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

  if (isLoading) return <p className="text-sm text-muted">Memuat akun akademi...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="label-caps text-secondary">Akses Akademi</p>
            <h2 className="font-heading text-xl font-bold text-primary">Akun Operasional</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="h-10 rounded-md border border-border px-3 text-sm" placeholder="Cari akun" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">Semua role</option>
              {canManagePengurus ? <option value="admin_akademi">Pengurus Akademi</option> : null}
              <option value="pelatih">Pelatih</option>
            </select>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Akun</th>
                <th className="pb-3">Jenis Akun</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">
                    {item.name}
                    {item.id === currentUserId ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wide text-primary">Akun saya</span> : null}
                    <span className="block text-xs font-medium text-muted">{item.email}</span>
                  </td>
                  <td className="py-3 text-muted">
                    {roleLabels[item.role]}
                    {item.coach_profile ? <span className="mt-1 block text-xs font-bold text-secondary">Juga pelatih</span> : null}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.is_active ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => startEdit(item)} type="button">Edit</button>
                    {item.is_active && item.id !== currentUserId ? (
                      <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleDeactivate(item)} type="button">Nonaktifkan</button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr>
                  <td className="py-8 text-sm text-muted" colSpan={4}>Belum ada akun yang bisa dikelola.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="card-soft h-fit rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
        <h2 className="font-heading text-lg font-bold text-primary">{editing ? editing.name : "Akun Akademi"}</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-primary">
            Nama
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Email
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Password
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required={!editing} placeholder={editing ? "Kosongkan jika tidak diubah" : ""} />
            {editing ? <span className="mt-1 block text-xs font-medium text-muted">Isi password baru hanya jika ingin reset password akun ini.</span> : null}
          </label>
          <label className="block text-sm font-semibold text-primary">
            Jenis akun
            {canManagePengurus && form.role !== "ketua_akademi" ? (
              <select
                className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm"
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
              <div className="mt-2 flex h-11 items-center rounded-md border border-border bg-surface-container px-3 text-sm text-muted">
                {roleLabels[form.role]}
              </div>
            )}
          </label>
          {form.role !== "pelatih" ? (
            <label className="flex items-start gap-3 rounded-md border border-border bg-surface-container-low p-3 text-sm font-semibold text-primary">
              <input
                className="mt-1"
                type="checkbox"
                checked={form.is_coach}
                onChange={(event) => setForm((current) => ({ ...current, is_coach: event.target.checked }))}
              />
              <span>
                Juga sebagai pelatih
                <span className="block text-xs font-medium leading-5 text-muted">
                  Akun ini tetap punya akses {roleLabels[form.role]}, tapi juga muncul sebagai profil pelatih.
                </span>
              </span>
            </label>
          ) : null}
          <p className="rounded-md border border-border bg-surface-container-low p-3 text-xs leading-5 text-muted">
            {form.role === "admin_akademi" || form.role === "ketua_akademi"
              ? "Pengurus bisa tetap memakai satu akun. Centang opsi pelatih jika orang yang sama juga mengajar di latihan."
              : "Akun pelatih hanya menentukan akses login. Data tingkatan, lisensi, dan profil pengajar diatur di menu Pelatih."}
          </p>
          <label className="flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={editing?.id === currentUserId}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            Akun aktif
          </label>
          {editing?.id === currentUserId ? (
            <p className="text-xs font-medium leading-5 text-muted">Akun sendiri tidak bisa dinonaktifkan dari halaman ini.</p>
          ) : null}
          <div className="flex gap-2">
            <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
            {editing ? <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={resetForm} type="button">Batal</button> : null}
          </div>
        </form>
      </aside>
    </div>
  );
}
