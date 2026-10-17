"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  TrainingPlace,
  createAkademiTrainingPlace,
  deleteAkademiTrainingPlace,
  getAkademiMe,
  getAkademiTrainingPlaces,
  updateAkademiTrainingPlace,
} from "../_lib/admin-api";
import { FormField, PageHeader, ResponsiveColumn, ResponsiveList, SheetModal } from "./ui";
import Icon from "./ui/icon";
import StatusMessage from "./ui/status-message";

const TOKEN_KEY = "skaihub_admin_token";

type PlaceForm = {
  name: string;
  address: string;
  is_active: boolean;
};

const emptyForm: PlaceForm = {
  name: "",
  address: "",
  is_active: true,
};

export default function AcademyPlacesManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<TrainingPlace[]>([]);
  const [form, setForm] = useState<PlaceForm>(emptyForm);
  const [editing, setEditing] = useState<TrainingPlace | null>(null);
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
      [item.name, item.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [items, query]);

  async function loadData(activeToken: string) {
    const [profileData, placeData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiTrainingPlaces(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setItems(placeData.data);
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat tempat latihan."))
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

  function startEdit(item: TrainingPlace) {
    setEditing(item);
    setForm({
      name: item.name,
      address: item.address || "",
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
        address: form.address || null,
        is_active: form.is_active,
      };

      if (editing) {
        await updateAkademiTrainingPlace(tokenRef.current, editing.id, payload);
      } else {
        await createAkademiTrainingPlace(tokenRef.current, payload);
      }

      await loadData(tokenRef.current);
      resetForm();
      setMessage(editing ? "Tempat latihan diperbarui." : "Tempat latihan ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan tempat latihan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: TrainingPlace) {
    const confirmed = window.confirm(`Hapus tempat latihan ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiTrainingPlace(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Tempat latihan dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus tempat latihan.");
    } finally {
      setIsSaving(false);
    }
  }

  const columns: ResponsiveColumn<TrainingPlace>[] = [
    {
      key: "name",
      header: "Nama",
      primary: true,
      render: (item) => <span className="font-bold text-primary">{item.name}</span>,
    },
    {
      key: "address",
      header: "Alamat",
      render: (item) => <span className="text-muted">{item.address || "-"}</span>,
    },
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
            render: (item: TrainingPlace) => (
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

  if (isLoading) return <p className="text-sm text-muted">Memuat tempat latihan...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Tempat Latihan"
        description="Kelola daftar dojang, gedung, dan fasilitas tempat berlangsungnya latihan."
        action={
          canManage ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-xs transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
            >
              <Icon name="add" className="text-[20px]" />
              Tambah Tempat
            </button>
          ) : undefined
        }
      />

      <StatusMessage tone="success" message={message} />
      <StatusMessage tone="error" message={error} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="places-search" className="sr-only">
            Cari tempat latihan
          </label>
          <input
            id="places-search"
            className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            placeholder="Cari tempat atau alamat..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <ResponsiveList
        columns={columns}
        rows={filteredItems}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar tempat latihan"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            {query ? "Tidak ada tempat latihan yang cocok dengan pencarian." : "Belum ada tempat latihan."}
          </div>
        }
      />

      <SheetModal
        isOpen={isFormOpen}
        onClose={resetForm}
        title={editing ? "Edit Tempat Latihan" : "Tambah Tempat Latihan"}
        description={editing ? `Perbarui data untuk ${editing.name}` : "Tambahkan tempat latihan baru untuk jadwal dan kelas."}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="place-name"
            label="Nama Tempat"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Contoh: Dojang Utama Gor Bulungan"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="place-address" className="text-xs font-bold uppercase tracking-wide text-primary">
              Alamat
            </label>
            <textarea
              id="place-address"
              rows={3}
              className="w-full border border-border-strong bg-white p-3 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="Alamat lengkap tempat latihan..."
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              className="size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            <span>Tempat latihan aktif</span>
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
