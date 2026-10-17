"use client";

import Link from "next/link";
import React from "react";
import { TrainingSession } from "../../_lib/admin-api";

export type AttendanceCalendarMobileProps = {
  sessions: TrainingSession[];
  activeMonthLabel: string;
};

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

const sessionTypeStyles: Record<TrainingSession["session_type"], string> = {
  regular: "bg-success/10 text-success-strong border-success/30",
  replacement: "bg-orange-100 text-orange-700 border-orange-300",
  extra: "bg-secondary/10 text-secondary border-secondary/30",
};

const statusLabels: Record<TrainingSession["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Batal",
  rescheduled: "Dipindah",
};

function shortTime(val: string) {
  return val?.slice(0, 5) || "";
}

export default function AttendanceCalendarMobile({
  sessions,
  activeMonthLabel,
}: AttendanceCalendarMobileProps) {
  if (sessions.length === 0) {
    return (
      <div className="border-2 border-dashed border-border bg-white p-6 text-center text-sm font-medium text-muted md:hidden">
        Tidak ada sesi latihan pada {activeMonthLabel}.
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden" data-testid="attendance-calendar-mobile">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="border-2 border-border bg-white p-4 transition hover:border-primary/40"
        >
          {/* Tanggal & Badge Jenis */}
          <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2.5">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                Tanggal Sesi
              </span>
              <p className="font-heading text-base font-bold text-primary">
                {session.session_date.slice(0, 10)} · {shortTime(session.starts_at)} - {shortTime(session.ends_at)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-sm border px-2 py-0.5 text-xs font-bold ${
                sessionTypeStyles[session.session_type]
              }`}
            >
              {sessionTypeLabels[session.session_type]}
            </span>
          </div>

          {/* Detail Kelas & Pelatih */}
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Kelas</span>
              <span className="font-bold text-primary">
                {session.class?.name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Pelatih</span>
              <span className="font-medium text-primary">
                {session.coaches?.length
                  ? session.coaches.map((c) => c.name).join(", ")
                  : session.coach?.name || "Belum dipilih"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Kehadiran</span>
              <span className="font-bold text-primary">
                {session.present_count || 0}/{session.attendances_count || 0} hadir
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">Status</span>
              <span className="inline-flex h-6 items-center rounded-sm bg-surface-container px-2 text-xs font-bold text-muted">
                {statusLabels[session.status]}
              </span>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="mt-3.5 pt-2 border-t border-border/80">
            <Link
              href={`/academy/attendance/new?session=${session.id}`}
              className="min-h-11 flex w-full items-center justify-center border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90"
            >
              Lanjutkan Absensi
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
