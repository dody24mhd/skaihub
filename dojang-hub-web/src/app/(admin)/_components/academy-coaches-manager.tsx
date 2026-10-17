"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Coach,
  getAkademiCoaches,
  getAkademiMe,
  updateAkademiCoach,
} from "../_lib/admin-api";
import { FormField, PageHeader, ResponsiveColumn, ResponsiveList, SheetModal } from "./ui";

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
    setIsFormOpen(false);
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
    setIsFormOpen(true);
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

  const columns: ResponsiveColumn<Coach>[] = [
    {
      key: "name",
      header: "Nama",
      primary: true,
      render: (item) => <span className="font-bold text-primary">{item.name}</span>,
    },
    {
      key: "contact",
      header: "Kontak",
      render: (item) => (
        <div>
          <span className="block text-primary">{item.email}</span>
          <span className="block text-xs text-muted">{item.coach_profile?.phone || "HP belum diisi"}</span>
        </div>
      ),
    },
    {
      key: "rank",
      header: "Tingkatan",
      render: (item) => <span className="text-muted">{item.coach_profile?.rank_label || "-"}</span>,
    },
    {
      key: "address",
      header: "Alamat",
      hideOnMobile: true,
      render: (item) => <span className="text-muted">{item.coach_profile?.address || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
            item.is_active ? "bg-success/10 text-success" : "bg-surface-container text-muted"
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
            render: (item: Coach) => (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="inline-flex min-h-11 items-center justify-center border border-border px-3.5 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  Edit Profil
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat pelatih...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Profil Pelatih"
        description="Kelola tingkatan sabuk, nomor lisensi, kontak, dan biodata pelatih akademi."
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="coaches-search" className="sr-only">
            Cari pelatih
          </label>
          <input
            id="coaches-search"
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            placeholder="Cari pelatih..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className="text-xs text-muted sm:text-right">
          Akun pelatih dibuat dari menu <span className="font-bold text-primary">Akun Akademi</span>.
        </p>
      </div>

      <ResponsiveList
        columns={columns}
        rows={filteredItems}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar pelatih akademi"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            {query ? "Tidak ada pelatih yang cocok dengan pencarian." : "Belum ada pelatih terdaftar."}
          </div>
        }
      />

      <SheetModal
        isOpen={isFormOpen}
        onClose={resetForm}
        title="Edit Profil Pelatih"
        description={editing ? `Perbarui profil dan lisensi untuk ${editing.name}` : undefined}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            id="coach-name"
            label="Nama Pelatih"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nama lengkap pelatih"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="coach-phone"
              label="Nomor HP"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="08123456789"
            />
            <FormField
              id="coach-joined"
              label="Tanggal Bergabung"
              type="date"
              value={form.joined_date}
              onChange={(event) => setForm((current) => ({ ...current, joined_date: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="coach-rank"
              label="Tingkatan Sabuk"
              value={form.rank_label}
              onChange={(event) => setForm((current) => ({ ...current, rank_label: event.target.value }))}
              placeholder="Contoh: Dan 2 Kukkiwon"
            />
            <FormField
              id="coach-license"
              label="Nomor Lisensi"
              value={form.license_number}
              onChange={(event) => setForm((current) => ({ ...current, license_number: event.target.value }))}
              placeholder="Contoh: L-2024-0012"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="coach-address" className="text-xs font-bold uppercase tracking-wide text-primary">
              Alamat Domisili
            </label>
            <textarea
              id="coach-address"
              rows={3}
              className="w-full border border-border bg-white p-3 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="Alamat domisili..."
            />
          </div>

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
