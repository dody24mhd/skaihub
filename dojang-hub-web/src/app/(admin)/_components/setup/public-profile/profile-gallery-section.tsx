/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  GalleryItem,
  addAkademiGalleryItem,
  deleteAkademiGalleryItem,
  updateAkademiGalleryItem,
  uploadAkademiFile,
} from "../../../_lib/admin-api";
import { FormField, SheetModal } from "../../ui";
import Icon from "../../ui/icon";

type ProfileGallerySectionProps = {
  galleryItems: GalleryItem[];
  token: string;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
};

export default function ProfileGallerySection({
  galleryItems,
  token,
  onRefresh,
  onNotify,
  onError,
}: ProfileGallerySectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  function closeModal() {
    setShowModal(false);
    setGalleryFile(null);
    setGalleryCaption("");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!galleryFile) return;

    setUploading(true);
    try {
      const uploaded = await uploadAkademiFile(token, galleryFile, "session_photo");
      await addAkademiGalleryItem(token, {
        image_url: uploaded.url,
        caption: galleryCaption.trim() || null,
      });
      await onRefresh();
      closeModal();
      onNotify("Foto galeri berhasil ditambahkan.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleAbout(item: GalleryItem) {
    try {
      await updateAkademiGalleryItem(token, item.id, {
        show_on_about: !item.show_on_about,
      });
      await onRefresh();
      onNotify("Pengaturan foto About Us diperbarui.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal mengubah status foto.");
    }
  }

  async function handleDelete(item: GalleryItem) {
    if (!window.confirm("Hapus foto ini dari galeri?")) return;
    try {
      await deleteAkademiGalleryItem(token, item.id);
      await onRefresh();
      onNotify("Foto galeri dihapus.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal menghapus foto.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Galeri Foto</h3>
            <p className="mt-1 text-sm text-muted">
              Dokumentasi latihan, ujian kenaikan tingkat, dan kejuaraan yang tampil di website publik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
          >
            <Icon name="add_photo_alternate" className="text-[20px]" />
            Tambah Foto
          </button>
        </div>

        {galleryItems.length === 0 ? (
          <div className="mt-5 border-2 border-dashed border-border p-10 text-center text-sm font-medium text-muted">
            <Icon name="photo_library" className="text-4xl text-muted/60" />
            <p className="mt-2">Belum ada foto dalam galeri. Unggah foto pertama kegiatan akademi Anda.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galleryItems.map((item) => (
              <div key={item.id} className="border border-border bg-white overflow-hidden flex flex-col justify-between">
                <div className="relative aspect-square bg-surface-container">
                  <img
                    src={item.image_url}
                    alt={item.caption ?? "Foto galeri"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Hapus foto"
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-xs bg-primary/80 text-white transition hover:bg-secondary"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                </div>
                <div className="border-t border-border p-2.5">
                  {item.caption ? (
                    <p className="mb-2 text-xs text-primary truncate" title={item.caption}>
                      {item.caption}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleToggleAbout(item)}
                    className="flex w-full items-center gap-2 text-left text-xs font-semibold text-primary"
                  >
                    <Icon name={item.show_on_about ? "check_box" : "check_box_outline_blank"} className={`text-[20px] ${item.show_on_about ? "text-secondary" : "text-muted"}`} />
                    <span>Tampil di About Us</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetModal
        isOpen={showModal}
        onClose={closeModal}
        title="Tambah Foto Galeri"
        description="Pilih foto kegiatan dan berikan keterangan untuk ditampilkan di galeri publik."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-file-input" className="text-xs font-bold uppercase tracking-wide text-primary">
              File Foto
            </label>
            <input
              id="gallery-file-input"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="w-full border border-border bg-white px-3.5 py-2 text-sm text-primary file:mr-3 file:border-0 file:bg-surface-container file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"
            />
          </div>

          <FormField
            id="gallery-caption-input"
            label="Keterangan Foto (Opsional)"
            value={galleryCaption}
            onChange={(e) => setGalleryCaption(e.target.value)}
            placeholder="Contoh: Latihan fisik dan teknik sabuk hijau"
            disabled={uploading}
          />

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={uploading}
              className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading || !galleryFile}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-6 text-sm font-bold text-white transition hover:bg-secondary-dark disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              {uploading && <Icon name="refresh" className="animate-spin text-[18px]" />}
              {uploading ? "Mengunggah..." : "Simpan Foto"}
            </button>
          </div>
        </form>
      </SheetModal>
    </div>
  );
}
