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
import { FormField, PageHeader, ResponsiveColumn, ResponsiveList, SheetModal } from "./ui";
import Icon from "./ui/icon";
import StatusMessage from "./ui/status-message";

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
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    setIsFormOpen(false);
  }

  function openCreateModal() {
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsFormOpen(true);
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
    setIsFormOpen(true);
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

  const columns: ResponsiveColumn<TrainingClass>[] = [
    {
      key: "name",
      header: "Kelas",
      primary: true,
      render: (item) => <span className="font-bold text-primary">{item.name}</span>,
    },
    {
      key: "training_place",
      header: "Tempat",
      render: (item) => <span className="text-muted">{item.training_place?.name || "-"}</span>,
    },
    {
      key: "target",
      header: "Target Sesi",
      render: (item) => <span className="text-muted">{item.target_sessions_per_month || 4}x/bulan</span>,
    },
    ...(canManage
      ? [
          {
            key: "spp_override",
            header: "Iuran SPP",
            render: (item: TrainingClass) => (
              <span className="text-muted">{money(item.spp_amount_override)}</span>
            ),
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
            item.is_active ? "bg-success/10 text-success-strong" : "bg-surface-container text-muted"
          }`}
        >
          {item.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "Aksi",
            headerClassName: "text-right",
            className: "text-right",
            render: (item: TrainingClass) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="inline-flex min-h-11 items-center justify-center border border-border px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary"
                >
                  Hapus
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat kelas...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Kelas / Unit"
        description="Kelola kelompok latihan utama siswa dan nominal SPP khusus jika ada."
        action={
          canManage ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-xs transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
            >
              <Icon name="add" className="text-[20px]" />
              Tambah Kelas
            </button>
          ) : undefined
        }
      />

      <StatusMessage tone="success" message={message} />
      <StatusMessage tone="error" message={error} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="classes-search" className="sr-only">
            Cari kelas atau tempat
          </label>
          <input
            id="classes-search"
            className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            placeholder="Cari kelas atau tempat..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <ResponsiveList
        columns={columns}
        rows={filteredItems}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar kelas atau unit latihan"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            {query ? "Tidak ada kelas yang cocok dengan pencarian." : "Belum ada kelas."}
          </div>
        }
      />

      <SheetModal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={editing ? "Edit Kelas" : "Tambah Kelas"}
        description={editing ? `Perbarui data untuk ${editing.name}` : "Tambahkan kelompok kelas baru untuk siswa dan jadwal latihan."}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="class-name"
            label="Nama Kelas"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Contoh: Reguler Sore Sabuk Putih-Kuning"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="class-place" className="text-xs font-bold uppercase tracking-wide text-primary">
              Tempat Latihan
            </label>
            <select
              id="class-place"
              className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-base text-primary transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
              value={form.training_place_id}
              onChange={(event) => setForm((current) => ({ ...current, training_place_id: event.target.value }))}
            >
              <option value="">Belum dipilih</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>

          <FormField
            id="class-spp"
            label="Iuran SPP Khusus"
            type="number"
            min="0"
            inputMode="numeric"
            value={form.spp_amount_override}
            onChange={(event) => setForm((current) => ({ ...current, spp_amount_override: event.target.value }))}
            placeholder="Kosongkan jika mengikuti tarif default akademi"
            hint="Isi jika kelas ini memiliki tarif SPP yang berbeda dari nominal default."
          />

          <FormField
            id="class-target"
            label="Target Sesi Per Bulan"
            type="number"
            min="1"
            max="31"
            inputMode="numeric"
            required
            value={form.target_sessions_per_month}
            onChange={(event) => setForm((current) => ({ ...current, target_sessions_per_month: event.target.value }))}
            hint="Standar jumlah pertemuan latihan bulanan (misal 4 atau 8 sesi)."
          />

          <label className="flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              className="size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            <span>Kelas aktif</span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
              onClick={resetForm}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
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
