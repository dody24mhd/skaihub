"use client";

import React from "react";
import { AttendanceStatus } from "../../_lib/admin-api";

export type AttendanceCounts = Record<AttendanceStatus, number>;

export type AttendanceSummaryBarProps = {
  counts: AttendanceCounts;
  isSaving: boolean;
  onSaveDraft: () => void;
  onComplete: () => void;
  className?: string;
};

export default function AttendanceSummaryBar({
  counts,
  isSaving,
  onSaveDraft,
  onComplete,
  className = "",
}: AttendanceSummaryBarProps) {
  return (
    <aside
      aria-label="Ringkasan kehadiran dan aksi simpan"
      className={`sticky bottom-16 md:bottom-4 z-30 border-2 border-border bg-white p-3.5 shadow-xl sm:p-4 ${className}`}
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Ringkasan Jumlah per Status */}
        <div className="grid grid-cols-4 gap-2 text-center sm:flex sm:items-center sm:gap-4 sm:text-left">
          <div className="border border-border/80 bg-surface-container-low/40 p-2 sm:border-0 sm:bg-transparent sm:p-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-success">
              Hadir
            </span>
            <span className="font-heading text-lg font-black text-primary">
              {counts.present}
            </span>
          </div>

          <div className="border border-border/80 bg-surface-container-low/40 p-2 sm:border-0 sm:bg-transparent sm:p-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Izin
            </span>
            <span className="font-heading text-lg font-black text-primary">
              {counts.excused}
            </span>
          </div>

          <div className="border border-border/80 bg-surface-container-low/40 p-2 sm:border-0 sm:bg-transparent sm:p-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Sakit
            </span>
            <span className="font-heading text-lg font-black text-primary">
              {counts.sick}
            </span>
          </div>

          <div className="border border-border/80 bg-surface-container-low/40 p-2 sm:border-0 sm:bg-transparent sm:p-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
              Alpa
            </span>
            <span className="font-heading text-lg font-black text-primary">
              {counts.absent}
            </span>
          </div>
        </div>

        {/* Tombol Simpan Penuh-Lebar di HP */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveDraft}
            className="min-h-11 flex w-full sm:w-auto items-center justify-center border-2 border-border bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-surface-container-low active:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onComplete}
            className="min-h-11 flex w-full sm:w-auto items-center justify-center border-2 border-primary bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Selesaikan Absensi
          </button>
        </div>
      </div>
    </aside>
  );
}
