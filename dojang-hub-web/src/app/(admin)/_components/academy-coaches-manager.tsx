"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Coach,
  getAkademiCoaches,
  getAkademiMe,
  updateAkademiCoach,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

type CoachForm = {
  name: string;
  phone: string;
  rank_label: string;
  license_number: string;
  joined_date: string;
  address: string;
};

const emptyForm: CoachForm = {
  name: "",
  phone: "",
  rank_label: "",
  license_number: "",
  joined_date: "",
  address: "",
};

export default function AcademyCoachesManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<Coach[]>([]);
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [query, setQuery] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.name, item.email, item.coach_profile?.phone, item.coach_profile?.rank_label, item.coach_profile?.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [items, query]);

  async function loadData(activeToken: string) {
    const [profileData, coachData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiCoaches(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setItems(coachData.data);
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat pelatih."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
  }

  function startEdit(item: Coach) {
    setEditing(item);
    setForm({
      name: item.name,
      phone: item.coach_profile?.phone || "",
      rank_label: item.coach_profile?.rank_label || "",
      license_number: item.coach_profile?.license_number || "",
      joined_date: item.coach_profile?.joined_date?.slice(0, 10) || "",
      address: item.coach_profile?.address || "",
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        rank_label: form.rank_label || null,
        license_number: form.license_number || null,
        joined_date: form.joined_date || null,
        address: form.address || null,
      };

      await updateAkademiCoach(tokenRef.current, editing.id, payload);

      await loadData(tokenRef.current);
      resetForm();
      setMessage("Profil pelatih diperbarui.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan pelatih.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat pelatih...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Profil Pelatih</h2>
          </div>
          <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari pelatih" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Nama</th>
                <th className="pb-3">Kontak</th>
                <th className="pb-3">Alamat</th>
                <th className="pb-3">Tingkatan</th>
                <th className="pb-3">Status</th>
                {canManage ? <th className="pb-3 text-right">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">{item.name}</td>
                  <td className="py-3 text-muted">
                    {item.email}
                    <span className="block text-xs">{item.coach_profile?.phone || "HP belum diisi"}</span>
                  </td>
                  <td className="py-3 text-muted">{item.coach_profile?.address || "-"}</td>
                  <td className="py-3 text-muted">{item.coach_profile?.rank_label || "-"}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.is_active ? "bg-success/10 text-success" : "bg-surface-container text-muted"}`}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="py-3 text-right">
                      <button className="rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => startEdit(item)} type="button">Edit Profil</button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr><td className="py-8 text-sm text-muted" colSpan={canManage ? 6 : 5}>Belum ada pelatih.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? (
        <aside className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">{editing ? "Edit" : "Profil"}</p>
          <h2 className="font-heading text-lg font-bold text-primary">{editing ? editing.name : "Pilih Pelatih"}</h2>
          {!editing ? (
            <p className="mt-3 rounded-md border border-border bg-surface-container-low p-3 text-sm leading-6 text-muted">
              Buat akun pelatih dari menu Akun Akademi terlebih dahulu. Setelah itu pilih pelatih di tabel untuk melengkapi profilnya.
            </p>
          ) : null}
          {editing ? (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-primary">
              Nama pelatih
              <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-primary">
                Nomor HP
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Tanggal bergabung
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="date" value={form.joined_date} onChange={(event) => setForm((current) => ({ ...current, joined_date: event.target.value }))} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-primary">
                Tingkatan
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.rank_label} onChange={(event) => setForm((current) => ({ ...current, rank_label: event.target.value }))} />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Nomor lisensi
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.license_number} onChange={(event) => setForm((current) => ({ ...current, license_number: event.target.value }))} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-primary">
              Alamat
              <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-primary" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </label>
            <div className="flex gap-2">
              <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
              {editing ? <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={resetForm} type="button">Batal</button> : null}
            </div>
          </form>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
