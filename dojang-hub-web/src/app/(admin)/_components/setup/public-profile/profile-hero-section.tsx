/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  HeroImage,
  addAkademiHeroImage,
  deleteAkademiHeroImage,
  updateAkademiHeroImage,
  uploadAkademiFile,
} from "../../../_lib/admin-api";
import { FormField, SheetModal } from "../../ui";
import Icon from "../../ui/icon";

type ProfileHeroSectionProps = {
  heroImages: HeroImage[];
  token: string;
  buttonColor?: string;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
};

export default function ProfileHeroSection({
  heroImages,
  token,
  buttonColor = "#d32f2f",
  onRefresh,
  onNotify,
  onError,
}: ProfileHeroSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroImage | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [heroFocalX, setHeroFocalX] = useState(50);
  const [heroFocalY, setHeroFocalY] = useState(50);
  const [heroPanX, setHeroPanX] = useState(0);
  const [heroPanY, setHeroPanY] = useState(0);
  const [heroZoom, setHeroZoom] = useState(100);
  const [heroInitialPanX, setHeroInitialPanX] = useState(0);
  const [heroInitialPanY, setHeroInitialPanY] = useState(0);
  const [heroInitialZoom, setHeroInitialZoom] = useState(100);
  const [heroDragStart, setHeroDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  function openModal(item?: HeroImage) {
    setEditingHero(item ?? null);
    setHeroFile(null);
    setHeroCaption(item?.caption ?? "");
    setHeroFocalX(item?.focal_x ?? 50);
    setHeroFocalY(item?.focal_y ?? 50);
    setHeroPanX(item?.pan_x ?? 0);
    setHeroPanY(item?.pan_y ?? 0);
    setHeroZoom(item?.zoom ?? 100);
    setHeroInitialPanX(item?.pan_x ?? 0);
    setHeroInitialPanY(item?.pan_y ?? 0);
    setHeroInitialZoom(item?.zoom ?? 100);
    setHeroPreviewUrl(item?.image_url ?? "");
    setShowModal(true);
  }

  function closeModal() {
    if (heroPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(heroPreviewUrl);
    setShowModal(false);
    setEditingHero(null);
    setHeroFile(null);
    setHeroPreviewUrl("");
    setHeroCaption("");
    setHeroFocalX(50);
    setHeroFocalY(50);
    setHeroPanX(0);
    setHeroPanY(0);
    setHeroZoom(100);
    setHeroInitialPanX(0);
    setHeroInitialPanY(0);
    setHeroInitialZoom(100);
    setHeroDragStart(null);
  }

  function handleFileChange(file: File | null) {
    if (heroPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(heroPreviewUrl);
    setHeroFile(file);
    setHeroPreviewUrl(file ? URL.createObjectURL(file) : "");
    setHeroPanX(0);
    setHeroPanY(0);
    setHeroZoom(100);
    setHeroInitialPanX(0);
    setHeroInitialPanY(0);
    setHeroInitialZoom(100);
  }

  function startDrag(e: React.PointerEvent<HTMLElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setHeroDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      panX: heroPanX,
      panY: heroPanY,
    });
  }

  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    if (!heroDragStart || e.buttons !== 1) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaX = ((e.clientX - heroDragStart.pointerX) / rect.width) * 80;
    const deltaY = ((e.clientY - heroDragStart.pointerY) / rect.height) * 80;
    setHeroPanX(Math.max(-100, Math.min(100, Math.round(heroDragStart.panX + deltaX))));
    setHeroPanY(Math.max(-100, Math.min(100, Math.round(heroDragStart.panY + deltaY))));
  }

  async function handleSave() {
    if (!editingHero && !heroFile) return;

    setUploading(true);
    try {
      if (editingHero) {
        await updateAkademiHeroImage(token, editingHero.id, {
          caption: heroCaption.trim() || null,
          focal_x: heroFocalX,
          focal_y: heroFocalY,
          pan_x: heroPanX,
          pan_y: heroPanY,
          zoom: heroZoom,
        });
        onNotify("Hero image diperbarui.");
      } else {
        const uploaded = await uploadAkademiFile(token, heroFile as File, "session_photo");
        await addAkademiHeroImage(token, {
          image_url: uploaded.url,
          caption: heroCaption.trim() || null,
          focal_x: heroFocalX,
          focal_y: heroFocalY,
          pan_x: heroPanX,
          pan_y: heroPanY,
          zoom: heroZoom,
          sort_order: heroImages.length,
          is_active: true,
        });
        onNotify("Gambar hero ditambahkan.");
      }
      await onRefresh();
      closeModal();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan hero image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggle(item: HeroImage) {
    try {
      await updateAkademiHeroImage(token, item.id, {
        is_active: !item.is_active,
      });
      await onRefresh();
      onNotify("Status hero diubah.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal mengubah status hero.");
    }
  }

  async function handleDelete(item: HeroImage) {
    if (!window.confirm("Hapus gambar hero ini?")) return;
    try {
      await deleteAkademiHeroImage(token, item.id);
      await onRefresh();
      onNotify("Gambar hero dihapus.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menghapus gambar hero.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Hero Slider</h3>
            <p className="mt-1 text-sm text-muted">
              Maksimal 3 foto untuk slider utama berdesain diagonal cut di halaman depan publik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal()}
            disabled={heroImages.length >= 3}
            className={`inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto ${
              heroImages.length >= 3
                ? "cursor-not-allowed bg-muted/60"
                : "bg-secondary hover:bg-secondary-dark"
            }`}
          >
            <Icon name="add_photo_alternate" className="text-[20px]" />
            Tambah Hero
          </button>
        </div>

        {heroImages.length === 0 ? (
          <div className="mt-5 border-2 border-dashed border-border p-8 text-center text-sm font-medium text-muted">
            Belum ada gambar hero. Unggah foto resolusi tinggi untuk memikat pengunjung website.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heroImages.map((item) => (
              <div key={item.id} className="border border-border bg-white">
                <div className="relative aspect-video bg-surface overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.caption ?? "Hero image"}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 50}%` }}
                  />
                  <span
                    className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-secondary shadow-xs"
                    style={{ left: `${item.focal_x ?? 50}%`, top: `${item.focal_y ?? 50}%` }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Hapus gambar hero"
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-xs bg-primary/80 text-white transition hover:bg-secondary"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                </div>
                <div className="border-t border-border p-3 space-y-2">
                  {item.caption ? (
                    <p className="text-xs font-medium text-primary truncate">{item.caption}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openModal(item)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 border border-border px-3 text-xs font-bold text-primary transition hover:bg-slate-50"
                    >
                      <Icon name="crop" className="text-[18px]" />
                      Atur Posisi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className={`inline-flex min-h-11 items-center justify-center px-3 text-xs font-bold border ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-surface-container text-muted border-border"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingHero ? "Atur Posisi Hero" : "Tambah Hero Image"}
        description="Frame hero diagonal cut: gambar dapat digeser dan di-zoom di dalam mask."
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {!editingHero ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hero-upload-input" className="text-xs font-bold uppercase tracking-wide text-primary">
                Pilih File Gambar
              </label>
              <input
                id="hero-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                disabled={uploading}
                className="w-full border border-border bg-white px-3.5 py-2 text-sm text-primary file:mr-3 file:border-0 file:bg-surface-container file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"
              />
            </div>
          ) : (
            <div className="border border-border bg-surface-container-low p-3 text-xs text-muted">
              Gambar hero tersimpan. Gunakan panel preview di bawah untuk menggeser posisi atau zoom gambar.
            </div>
          )}

          <FormField
            id="hero-caption-input"
            label="Caption Hero (Opsional)"
            value={heroCaption}
            onChange={(e) => setHeroCaption(e.target.value)}
            placeholder="Contoh: Latihan teknik disiplin dan kyorugi"
            disabled={uploading}
          />

          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-primary">
              Pratinjau Crop Hero
            </span>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setHeroPanX((v) => Math.max(-100, v - 2));
                if (e.key === "ArrowRight") setHeroPanX((v) => Math.min(100, v + 2));
                if (e.key === "ArrowUp") setHeroPanY((v) => Math.max(-100, v - 2));
                if (e.key === "ArrowDown") setHeroPanY((v) => Math.min(100, v + 2));
              }}
              className="relative mt-2 aspect-[16/7] touch-none select-none overflow-hidden border border-border bg-slate-950"
              title="Tahan dan geser gambar di dalam preview"
            >
              {heroPreviewUrl ? (
                <>
                  <img
                    src={heroPreviewUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full select-none object-cover opacity-25 blur-[1px]"
                    style={{
                      transform: `translate(${heroPanX}%, ${heroPanY}%) scale(${heroZoom / 100})`,
                      transformOrigin: "center",
                    }}
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)" }}
                  >
                    <img
                      src={heroPreviewUrl}
                      alt=""
                      draggable={false}
                      className="h-full w-full select-none object-cover"
                      style={{
                        transform: `translate(${heroPanX}%, ${heroPanY}%) scale(${heroZoom / 100})`,
                        transformOrigin: "center",
                      }}
                    />
                  </div>
                </>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-end pr-10 text-white/30"
                  style={{ clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)" }}
                >
                  <Icon name="wallpaper" className="text-5xl" />
                </div>
              )}

              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[56%] bg-primary" />
              <div
                className="pointer-events-none absolute inset-0 z-20"
                style={{
                  backgroundColor: buttonColor,
                  clipPath: "polygon(57% 0%, 59.5% 0%, 49.5% 100%, 47% 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 z-30 border-2 border-dashed border-white/60"
                style={{ clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)" }}
              />

              <div
                role="presentation"
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={() => setHeroDragStart(null)}
                onPointerCancel={() => setHeroDragStart(null)}
                className="absolute inset-0 z-40 cursor-grab touch-none active:cursor-grabbing"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHeroZoom((v) => Math.max(100, v - 10))}
                className="inline-flex size-11 items-center justify-center border border-border text-lg font-bold text-primary hover:border-secondary hover:text-secondary"
              >
                -
              </button>
              <div className="flex min-h-11 min-w-20 items-center justify-center border border-border px-3 text-sm font-bold text-primary">
                {heroZoom}%
              </div>
              <button
                type="button"
                onClick={() => setHeroZoom((v) => Math.min(200, v + 10))}
                className="inline-flex size-11 items-center justify-center border border-border text-lg font-bold text-primary hover:border-secondary hover:text-secondary"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeroPanX(heroInitialPanX);
                  setHeroPanY(heroInitialPanY);
                  setHeroZoom(heroInitialZoom);
                }}
                className="ml-auto inline-flex min-h-11 items-center justify-center border border-border px-4 text-xs font-bold uppercase tracking-wider text-muted hover:border-secondary hover:text-secondary"
              >
                Reset
              </button>
            </div>
          </div>

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
              type="button"
              onClick={handleSave}
              disabled={uploading || (!editingHero && !heroFile)}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-6 text-sm font-bold text-white transition hover:bg-secondary-dark disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              {uploading && <Icon name="refresh" className="animate-spin text-[18px]" />}
              {uploading ? "Menyimpan..." : "Simpan Hero"}
            </button>
          </div>
        </div>
      </SheetModal>
    </div>
  );
}
