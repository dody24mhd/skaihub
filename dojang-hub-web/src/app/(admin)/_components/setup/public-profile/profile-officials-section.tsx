/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  PublicOfficial,
  addAkademiPublicOfficial,
  deleteAkademiPublicOfficial,
  updateAkademiPublicOfficial,
  uploadAkademiFile,
} from "../../../_lib/admin-api";
import { FormField, SheetModal } from "../../ui";

type ProfileOfficialsSectionProps = {
  officials: PublicOfficial[];
  token: string;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
};

export default function ProfileOfficialsSection({
  officials,
  token,
  onRefresh,
  onNotify,
  onError,
}: ProfileOfficialsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<PublicOfficial | null>(null);
  const [officialFile, setOfficialFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    description: "",
    photo_url: "",
  });
  const [saving, setSaving] = useState(false);

  function openCreateModal() {
    setEditingOfficial(null);
    setOfficialFile(null);
    setForm({ name: "", position: "", description: "", photo_url: "" });
    setIsModalOpen(true);
  }

  function startEdit(official: PublicOfficial) {
    setEditingOfficial(official);
    setOfficialFile(null);
    setForm({
      name: official.name,
      position: official.position,
      description: official.description || "",
      photo_url: official.photo_url || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingOfficial(null);
    setOfficialFile(null);
    setForm({ name: "", position: "", description: "", photo_url: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) return;

    setSaving(true);
    try {
      let photoUrl = form.photo_url.trim() || null;
      if (officialFile) {
        const uploaded = await uploadAkademiFile(token, officialFile, "session_photo");
        photoUrl = uploaded.url;
      }

      if (editingOfficial) {
        await updateAkademiPublicOfficial(token, editingOfficial.id, {
          name: form.name.trim(),
          position: form.position.trim(),
          description: form.description.trim() || null,
          photo_url: photoUrl,
          is_active: editingOfficial.is_active,
        });
        onNotify("Pengurus diperbarui.");
      } else {
        await addAkademiPublicOfficial(token, {
          name: form.name.trim(),
          position: form.position.trim(),
          description: form.description.trim() || null,
          photo_url: photoUrl,
          sort_order: officials.length,
          is_active: true,
        });
        onNotify("Pengurus ditambahkan.");
      }

      await onRefresh();
      closeModal();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal menyimpan pengurus.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(official: PublicOfficial) {
    try {
      await updateAkademiPublicOfficial(token, official.id, {
        is_active: !official.is_active,
      });
      await onRefresh();
      onNotify("Status pengurus diubah.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal mengubah status pengurus.");
    }
  }

  async function handleDelete(official: PublicOfficial) {
    if (!window.confirm(`Hapus pengurus "${official.name}"?`)) return;
    try {
      await deleteAkademiPublicOfficial(token, official.id);
      await onRefresh();
      onNotify("Pengurus dihapus.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal menghapus pengurus.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Struktur Pengurus
            </h3>
            <p className="mt-1 text-sm text-muted">
              Daftar susunan pengurus akademi yang ditampilkan di website publik.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary/50 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Tambah Pengurus
          </button>
        </div>

        {officials.length === 0 ? (
          <div className="mt-5 border-2 border-dashed border-border p-8 text-center text-sm font-medium text-muted">
            Belum ada pengurus publik. Tambahkan ketua, sekretaris, bendahara, atau dewan pembina.
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border border border-border">
            {officials.map((official) => (
              <div
                key={official.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {official.photo_url ? (
                    <img
                      src={official.photo_url}
                      alt={official.name}
                      className="size-14 shrink-0 rounded-xs object-cover border border-border"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xs bg-surface-container border border-border text-muted">
                      <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-primary">{official.name}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {official.position}
                    </p>
                    {official.description && (
                      <p className="mt-1 text-xs text-muted line-clamp-2">{official.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(official)}
                    className={`inline-flex min-h-11 items-center justify-center px-3 text-xs font-bold ${
                      official.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-surface-container text-muted border border-border"
                    }`}
                  >
                    {official.is_active ? "Aktif" : "Disembunyikan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(official)}
                    className="inline-flex min-h-11 items-center justify-center border border-border px-3.5 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(official)}
                    className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3.5 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary/20"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingOfficial ? "Edit Pengurus" : "Tambah Pengurus"}
        description="Kelola nama, jabatan, dan foto pengurus untuk profil publik."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="official-name"
            label="Nama Lengkap"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Contoh: Bpk. H. Ahmad Fauzi"
          />

          <FormField
            id="official-position"
            label="Jabatan"
            required
            value={form.position}
            onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            placeholder="Contoh: Ketua Dojang / Sekretaris / Bendahara"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="official-photo-file" className="text-xs font-bold uppercase tracking-wide text-primary">
              Unggah Foto Pengurus
            </label>
            <input
              id="official-photo-file"
              type="file"
              accept="image/*"
              onChange={(e) => setOfficialFile(e.target.files?.[0] ?? null)}
              className="w-full border border-border bg-white px-3.5 py-2 text-sm text-primary file:mr-3 file:border-0 file:bg-surface-container file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"
            />
          </div>

          <FormField
            id="official-photo-url"
            label="Atau Gunakan URL Foto"
            value={form.photo_url}
            onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))}
            placeholder="https://..."
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="official-desc" className="text-xs font-bold uppercase tracking-wide text-primary">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              id="official-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Profil singkat, latar belakang, atau peran pengurus..."
              className="w-full border border-border bg-white p-3.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </SheetModal>
    </div>
  );
}
