"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  SportRank,
  createAkademiSportRank,
  deleteAkademiSportRank,
  getAkademiSportRanks,
  updateAkademiSportRank,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const beltOptions = [
  { code: "white", label: "Putih", className: "bg-white border-slate-300" },
  { code: "yellow", label: "Kuning", className: "bg-yellow-300 border-yellow-500" },
  { code: "green", label: "Hijau", className: "bg-emerald-500 border-emerald-700" },
  { code: "blue", label: "Biru", className: "bg-blue-600 border-blue-800" },
  { code: "red", label: "Merah", className: "bg-red-600 border-red-800" },
  { code: "black", label: "Hitam", className: "bg-neutral-950 border-neutral-700" },
  { code: "poom", label: "Poom", className: "bg-red-600 border-neutral-900" },
];

type RankForm = {
  code: string;
  label: string;
  sequence: string;
};

const emptyForm: RankForm = {
  code: "",
  label: "",
  sequence: "1",
};

function optionForCode(code: string) {
  return beltOptions.find((option) => option.code === code);
}

function BeltIcon({ code, label }: { code: string; label: string }) {
  const option = optionForCode(code);
  const className = option?.className || "bg-slate-200 border-slate-400";

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`relative inline-flex h-4 w-12 overflow-hidden rounded-sm border ${className}`} aria-hidden="true">
        {code === "poom" ? <span className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" /> : null}
        <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/70" />
      </span>
      <span>{option?.label || label}</span>
    </span>
  );
}

export default function AcademyRanksManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<SportRank[]>([]);
  const [form, setForm] = useState<RankForm>(emptyForm);
  const [editing, setEditing] = useState<SportRank | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => [item.code, item.label, String(item.sequence)]
      .some((value) => value.toLowerCase().includes(keyword)));
  }, [items, query]);

  async function loadData(activeToken: string) {
    const response = await getAkademiSportRanks(activeToken);
    setItems(response.data);
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat tingkatan."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function startEdit(item: SportRank) {
    setEditing(item);
    setForm({
      code: item.code,
      label: item.label,
      sequence: String(item.sequence),
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
        code: form.code.trim(),
        label: form.label.trim(),
        sequence: Number(form.sequence),
      };

      if (editing) {
        await updateAkademiSportRank(tokenRef.current, editing.id, payload);
      } else {
        await createAkademiSportRank(tokenRef.current, payload);
      }

      await loadData(tokenRef.current);
      resetForm();
      setMessage(editing ? "Tingkatan diperbarui." : "Tingkatan ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan tingkatan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: SportRank) {
    const confirmed = window.confirm(`Hapus tingkatan ${item.label}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiSportRank(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Tingkatan dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus tingkatan.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat tingkatan...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Sabuk / Tingkatan</h2>
          </div>
          <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari tingkatan" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Urutan</th>
                <th className="pb-3">Icon Warna</th>
                <th className="pb-3">Nama Tingkatan</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">{item.sequence}</td>
                  <td className="py-3 text-muted"><BeltIcon code={item.code} label={item.label} /></td>
                  <td className="py-3 font-bold text-primary">{item.label}</td>
                  <td className="py-3 text-right">
                    <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => startEdit(item)} type="button">Edit</button>
                    <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleDelete(item)} type="button">Hapus</button>
                  </td>
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr><td className="py-8 text-sm text-muted" colSpan={4}>Belum ada tingkatan.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="card-soft h-fit rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
        <h2 className="font-heading text-lg font-bold text-primary">{editing ? editing.label : "Tingkatan Baru"}</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-primary">
            Nama tingkatan
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Icon warna
            <div className="mt-2 grid grid-cols-2 gap-2">
              {beltOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, code: option.code }))}
                  className={`flex h-11 items-center justify-between rounded-md border px-3 text-sm font-bold transition ${form.code === option.code ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:bg-surface-container"}`}
                >
                  <BeltIcon code={option.code} label={option.label} />
                </button>
              ))}
            </div>
          </label>
          <label className="block text-sm font-semibold text-primary">
            Kode custom
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Misal: dan-1, strip-1" required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Urutan
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="number" min="1" max="999" value={form.sequence} onChange={(event) => setForm((current) => ({ ...current, sequence: event.target.value }))} required />
          </label>
          <div className="flex gap-2">
            <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
            {editing ? <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={resetForm} type="button">Batal</button> : null}
          </div>
        </form>
      </aside>
    </div>
  );
}
