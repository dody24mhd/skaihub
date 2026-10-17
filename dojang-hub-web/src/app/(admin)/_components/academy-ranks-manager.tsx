"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  SportRank,
  createAkademiSportRank,
  deleteAkademiSportRank,
  getAkademiSportRanks,
  updateAkademiSportRank,
} from "../_lib/admin-api";
import { FormField, ResponsiveColumn, ResponsiveList, SheetModal } from "./ui";

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
      <span
        className={`relative inline-flex h-4 w-12 overflow-hidden rounded-sm border ${className}`}
        aria-hidden="true"
      >
        {code === "poom" ? (
          <span className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" />
        ) : null}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.code, item.label, String(item.sequence)].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
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
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Gagal memuat tingkatan.")
        )
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function startEdit(item: SportRank, openModal = false) {
    setEditing(item);
    setForm({
      code: item.code,
      label: item.label,
      sequence: String(item.sequence),
    });
    setMessage("");
    setError("");
    if (openModal) {
      setIsModalOpen(true);
    }
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
      setIsModalOpen(false);
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

  const columns: ResponsiveColumn<SportRank>[] = [
    {
      key: "label",
      header: "Nama Tingkatan",
      primary: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <BeltIcon code={item.code} label={item.label} />
          <span className="text-xs font-semibold text-muted md:hidden">
            (Urutan: {item.sequence})
          </span>
        </div>
      ),
    },
    {
      key: "sequence",
      header: "Urutan",
      render: (item) => (
        <span className="font-bold text-primary">{item.sequence}</span>
      ),
    },
    {
      key: "code",
      header: "Kode",
      render: (item) => (
        <span className="rounded-sm bg-surface-container px-2 py-0.5 text-xs font-mono text-muted">
          {item.code}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container"
            onClick={() => startEdit(item, true)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
            onClick={() => handleDelete(item)}
            type="button"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  const renderFormContent = (idPrefix: string) => (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField
        id={`${idPrefix}-label`}
        label="Nama tingkatan"
        value={form.label}
        onChange={(e) => setForm((cur) => ({ ...cur, label: e.target.value }))}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-primary">
          Icon warna
        </label>
        <div className="grid grid-cols-2 gap-2">
          {beltOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setForm((cur) => ({ ...cur, code: option.code }))}
              className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-sm font-bold transition ${
                form.code === option.code
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted hover:bg-surface-container"
              }`}
            >
              <BeltIcon code={option.code} label={option.label} />
            </button>
          ))}
        </div>
      </div>
      <FormField
        id={`${idPrefix}-code`}
        label="Kode custom"
        placeholder="Misal: dan-1, strip-1"
        value={form.code}
        onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value }))}
        required
      />
      <FormField
        id={`${idPrefix}-sequence`}
        label="Urutan"
        type="number"
        inputMode="numeric"
        min="1"
        max="999"
        value={form.sequence}
        onChange={(e) => setForm((cur) => ({ ...cur, sequence: e.target.value }))}
        required
      />
      <div className="flex gap-2 pt-2">
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
        {editing ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary hover:bg-surface-container"
            onClick={() => {
              resetForm();
              setIsModalOpen(false);
            }}
            type="button"
          >
            Batal
          </button>
        ) : null}
      </div>
    </form>
  );

  if (isLoading) return <p className="text-sm text-muted">Memuat tingkatan...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Sabuk / Tingkatan</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="min-h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              placeholder="Cari tingkatan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Cari tingkatan"
            />
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark xl:hidden"
            >
              + Tambah Tingkatan
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <ResponsiveList
            columns={columns}
            rows={filteredItems}
            getRowKey={(item) => item.id}
            ariaLabel="Daftar Sabuk dan Tingkatan"
            emptyState={
              <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
                Belum ada tingkatan.
              </div>
            }
          />
        </div>
      </section>

      {/* Aside Desktop (xl+) */}
      <aside className="card-soft hidden h-fit rounded-lg bg-white p-5 xl:block">
        <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
        <h2 className="font-heading text-lg font-bold text-primary">
          {editing ? editing.label : "Tingkatan Baru"}
        </h2>
        <div className="mt-4">{renderFormContent("desktop")}</div>
      </aside>

      {/* SheetModal Mobile (< xl) */}
      <SheetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editing ? `Edit ${editing.label}` : "Tambah Tingkatan"}
        description="Kelola master sabuk atau level tingkatan siswa."
      >
        {renderFormContent("modal")}
      </SheetModal>
    </div>
  );
}
