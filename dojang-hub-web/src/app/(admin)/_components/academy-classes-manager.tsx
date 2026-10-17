"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  TrainingClass,
  TrainingPlace,
  createAkademiClass,
  deleteAkademiClass,
  getAkademiClasses,
  getAkademiMe,
  getAkademiTrainingPlaces,
  updateAkademiClass,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

type ClassForm = {
  name: string;
  training_place_id: string;
  spp_amount_override: string;
  target_sessions_per_month: string;
  is_active: boolean;
};

const emptyForm: ClassForm = {
  name: "",
  training_place_id: "",
  spp_amount_override: "",
  target_sessions_per_month: "4",
  is_active: true,
};

function money(value: string | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

export default function AcademyClassesManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<TrainingClass[]>([]);
  const [places, setPlaces] = useState<TrainingPlace[]>([]);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [editing, setEditing] = useState<TrainingClass | null>(null);
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
      [item.name, item.training_place?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [items, query]);

  async function loadData(activeToken: string) {
    const [profileData, classData, placeData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiClasses(activeToken),
      getAkademiTrainingPlaces(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setItems(classData.data);
    setPlaces(placeData.data);
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat kelas."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
  }

  function startEdit(item: TrainingClass) {
    setEditing(item);
    setForm({
      name: item.name,
      training_place_id: item.training_place_id ? String(item.training_place_id) : "",
      spp_amount_override: item.spp_amount_override ? String(Number(item.spp_amount_override)) : "",
      target_sessions_per_month: String(item.target_sessions_per_month || 4),
      is_active: item.is_active,
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name,
        training_place_id: form.training_place_id ? Number(form.training_place_id) : null,
        spp_amount_override: form.spp_amount_override ? Number(form.spp_amount_override) : null,
        target_sessions_per_month: Number(form.target_sessions_per_month || 4),
        is_active: form.is_active,
      };

      if (editing) {
        await updateAkademiClass(tokenRef.current, editing.id, payload);
      } else {
        await createAkademiClass(tokenRef.current, payload);
      }

      await loadData(tokenRef.current);
      resetForm();
      setMessage(editing ? "Kelas diperbarui." : "Kelas ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan kelas.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: TrainingClass) {
    const confirmed = window.confirm(`Hapus kelas ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiClass(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Kelas dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus kelas.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat kelas...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Kelas / Unit</h2>
          </div>
          <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari kelas atau tempat" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Tempat</th>
                <th className="pb-3">Target</th>
                {canManage ? <th className="pb-3">Iuran SPP</th> : null}
                <th className="pb-3">Status</th>
                {canManage ? <th className="pb-3 text-right">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">{item.name}</td>
                  <td className="py-3 text-muted">{item.training_place?.name || "-"}</td>
                  <td className="py-3 text-muted">{item.target_sessions_per_month || 4}x/bulan</td>
                  {canManage ? <td className="py-3 text-muted">{money(item.spp_amount_override)}</td> : null}
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.is_active ? "bg-success/10 text-success" : "bg-surface-container text-muted"}`}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="py-3 text-right">
                      <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => startEdit(item)} type="button">Edit</button>
                      <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleDelete(item)} type="button">Hapus</button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr><td className="py-8 text-sm text-muted" colSpan={canManage ? 6 : 4}>Belum ada kelas.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? (
        <aside className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
          <h2 className="font-heading text-lg font-bold text-primary">{editing ? editing.name : "Kelas Baru"}</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-primary">
              Nama kelas
              <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label className="block text-sm font-semibold text-primary">
              Tempat latihan
              <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.training_place_id} onChange={(event) => setForm((current) => ({ ...current, training_place_id: event.target.value }))}>
                <option value="">Belum dipilih</option>
                {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-primary">
              Iuran SPP
              <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="number" min="0" value={form.spp_amount_override} onChange={(event) => setForm((current) => ({ ...current, spp_amount_override: event.target.value }))} placeholder="Kosongkan jika ikut default" />
            </label>
            <label className="block text-sm font-semibold text-primary">
              Target sesi per bulan
              <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="number" min="1" max="31" value={form.target_sessions_per_month} onChange={(event) => setForm((current) => ({ ...current, target_sessions_per_month: event.target.value }))} required />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-primary">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Aktif
            </label>
            <div className="flex gap-2">
              <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
              {editing ? <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={resetForm} type="button">Batal</button> : null}
            </div>
          </form>
        </aside>
      ) : null}
    </div>
  );
}
