"use client";

import React from "react";
import { TrainingClass, TrainingSession } from "../../_lib/admin-api";
import { FormField } from "../ui";

export type AttendanceSessionCreateProps = {
  classes: TrainingClass[];
  activeDate: string;
  onDateChange: (val: string) => void;
  canPickAnyDate: boolean;
  sessionType: TrainingSession["session_type"];
  onSessionTypeChange: (val: TrainingSession["session_type"]) => void;
  classId: string;
  onClassChange: (val: string) => void;
  startsAt: string;
  onStartsAtChange: (val: string) => void;
  endsAt: string;
  onEndsAtChange: (val: string) => void;
  isSaving: boolean;
  onSubmit: () => void;
};

export default function AttendanceSessionCreate({
  classes,
  activeDate,
  onDateChange,
  canPickAnyDate,
  sessionType,
  onSessionTypeChange,
  classId,
  onClassChange,
  startsAt,
  onStartsAtChange,
  endsAt,
  onEndsAtChange,
  isSaving,
  onSubmit,
}: AttendanceSessionCreateProps) {
  return (
    <div className="mt-4 space-y-5">
      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1 w-6 bg-secondary" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
            Berita Acara
          </span>
        </div>
        <h3 className="font-heading text-lg font-bold text-primary">
          Buka Absensi
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Pilih tipe absensi, kelas, dan jam latihan. Setelah berita acara dibuka, daftar hadir siswa akan dibuat otomatis dari kelas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          id="session-date"
          label="Tanggal Latihan"
          required
        >
          <input
            id="session-date"
            type="date"
            value={activeDate}
            disabled={!canPickAnyDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container sm:text-sm"
          />
        </FormField>

        <FormField id="session-type" label="Tipe Absensi" required>
          <select
            id="session-type"
            value={sessionType}
            onChange={(e) =>
              onSessionTypeChange(
                e.target.value as TrainingSession["session_type"]
              )
            }
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="regular">Reguler</option>
            <option value="replacement">Pengganti</option>
            <option value="extra">Tambahan</option>
          </select>
        </FormField>

        <FormField id="session-class" label="Kelas Absensi" required>
          <select
            id="session-class"
            value={classId}
            onChange={(e) => onClassChange(e.target.value)}
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="">Pilih kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="session-starts-at" label="Mulai" required>
          <input
            id="session-starts-at"
            type="time"
            value={startsAt}
            onChange={(e) => onStartsAtChange(e.target.value)}
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
          />
        </FormField>

        <FormField id="session-ends-at" label="Selesai" required>
          <input
            id="session-ends-at"
            type="time"
            value={endsAt}
            onChange={(e) => onEndsAtChange(e.target.value)}
            className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 sm:text-sm"
          />
        </FormField>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={onSubmit}
        className="min-h-11 flex w-full sm:w-auto items-center justify-center border-2 border-primary bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted"
      >
        {isSaving ? "Membuka..." : "Buka Berita Acara"}
      </button>
    </div>
  );
}
