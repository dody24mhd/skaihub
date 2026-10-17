"use client";

import React from "react";
import { Coach, TrainingSession } from "../../_lib/admin-api";
import Icon from "../ui/icon";

export type AttendanceSessionInfoProps = {
  selected: TrainingSession;
  canCreate: boolean;
  coaches: Coach[];
  selectedCoachIds: string[];
  onToggleCoach: (coachId: number) => void;
  material: string;
  onMaterialChange: (val: string) => void;
  extraName: string;
  onExtraNameChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  photoUrls: string;
  onPhotoUpload: (file: File | null) => void;
  onRemovePhoto: (url: string) => void;
  isUploading: boolean;
};

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

function time(val: string) {
  return val?.slice(0, 5) || "";
}

export default function AttendanceSessionInfo({
  selected,
  canCreate,
  coaches,
  selectedCoachIds,
  onToggleCoach,
  material,
  onMaterialChange,
  extraName,
  onExtraNameChange,
  notes,
  onNotesChange,
  photoUrls,
  onPhotoUpload,
  onRemovePhoto,
  isUploading,
}: AttendanceSessionInfoProps) {
  return (
    <div className="space-y-6">
      {/* Info Singkat Sesi */}
      <div className="border border-border bg-surface-container-low/50 p-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Tanggal
            </span>
            <p className="font-heading font-bold text-primary">
              {selected.session_date.slice(0, 10)}
            </p>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Jam
            </span>
            <p className="font-heading font-bold text-primary">
              {time(selected.starts_at)} - {time(selected.ends_at)}
            </p>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Jenis
            </span>
            <p className="font-heading font-bold text-primary">
              {sessionTypeLabels[selected.session_type]}
            </p>
          </div>
        </div>
      </div>

      {/* Pelatih Sesi */}
      {canCreate ? (
        <fieldset className="block">
          <legend className="text-xs font-bold uppercase tracking-wider text-primary">
            Pelatih Sesi
          </legend>
          <div className="mt-2 flex flex-wrap gap-2 border border-border p-3">
            {coaches.map((c) => (
              <label
                key={c.id}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-border bg-white px-3 text-sm font-bold text-primary transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
              >
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={selectedCoachIds.includes(String(c.id))}
                  onChange={() => onToggleCoach(c.id)}
                />
                <Icon name="sports_martial_arts" className="text-[18px]" />
                {c.name}
              </label>
            ))}
            {!coaches.length ? (
              <p className="text-sm text-muted">Belum ada pelatih aktif.</p>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {/* Berita Acara & Peserta Tambahan */}
      <div className="border-t border-border pt-5">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1 w-6 bg-secondary" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
            Berita Acara
          </span>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="material-input" className="text-xs font-bold uppercase tracking-wider text-primary">
              Materi Latihan
            </label>
            <input
              id="material-input"
              value={material}
              onChange={(e) => onMaterialChange(e.target.value)}
              placeholder="Contoh: Poomsae Taegeuk 1"
              className="mt-1.5 min-h-11 w-full border border-border bg-white px-3.5 py-2 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="extra-participant-input" className="text-xs font-bold uppercase tracking-wider text-primary">
              Peserta Tambahan
            </label>
            <input
              id="extra-participant-input"
              value={extraName}
              onChange={(e) => onExtraNameChange(e.target.value)}
              placeholder="Nama peserta trial / pengganti"
              className="mt-1.5 min-h-11 w-full border border-border bg-white px-3.5 py-2 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="notes-textarea" className="text-xs font-bold uppercase tracking-wider text-primary">
            Catatan / Berita Acara
          </label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Catatan perkembangan atau kejadian saat latihan..."
            className="mt-1.5 min-h-24 w-full border border-border bg-white p-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Upload Foto */}
        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-primary">
            Dokumentasi Foto
          </label>
          <label className="mt-1.5 flex min-h-11 cursor-pointer items-center justify-between border-2 border-dashed border-border bg-surface-container-low/40 px-3.5 py-2 text-sm text-muted transition hover:border-primary hover:bg-white">
            <span className="inline-flex items-center gap-2 text-primary font-medium">
              <Icon name="upload" className="text-[20px]" />
              Upload foto sesi latihan
            </span>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Pilih foto
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onPhotoUpload(e.target.files?.[0] || null)}
            />
          </label>
          {isUploading ? (
            <span className="mt-1.5 block text-xs font-bold text-muted">Mengupload...</span>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {photoUrls
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean)
              .map((url) => (
                <div
                  key={url}
                  className="flex items-center justify-between gap-2 border border-border bg-white p-2"
                >
                  <a
                    className="truncate text-xs font-bold text-secondary hover:underline"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Foto sesi
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(url)}
                    className="min-h-8 border border-border px-2 text-xs font-bold text-primary hover:bg-surface-container"
                  >
                    Hapus
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
