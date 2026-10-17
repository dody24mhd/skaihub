"use client";

import React from "react";
import { AttendanceStatus, TrainingAttendance } from "../../_lib/admin-api";
import AttendanceStudentCard from "./attendance-student-card";
import { normalizeStatus } from "../academy-attendance-manager";

export type AttendanceStudentListProps = {
  attendances: TrainingAttendance[];
  attendanceEdits: Record<number, AttendanceStatus>;
  onSetAll: (status: AttendanceStatus) => void;
  onStatusChange: (attendanceId: number, status: AttendanceStatus) => void;
};

export default function AttendanceStudentList({
  attendances,
  attendanceEdits,
  onSetAll,
  onStatusChange,
}: AttendanceStudentListProps) {
  return (
    <div className="border-t border-border pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-1 w-6 bg-secondary" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
              Daftar Hadir
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary">
            Peserta Latihan ({attendances.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSetAll("present")}
            className="min-h-11 flex-1 sm:flex-none border-2 border-success bg-success/10 px-3.5 text-xs font-bold uppercase text-success transition hover:bg-success hover:text-white"
          >
            Semua Hadir
          </button>
          <button
            type="button"
            onClick={() => onSetAll("absent")}
            className="min-h-11 flex-1 sm:flex-none border-2 border-border bg-white px-3.5 text-xs font-bold uppercase text-primary transition hover:bg-surface-container"
          >
            Semua Alpa
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {attendances.map((att) => (
          <AttendanceStudentCard
            key={att.id}
            attendanceId={att.id}
            studentName={att.student?.name || att.participant_name || "Peserta"}
            rankName={att.student?.rank?.name}
            status={attendanceEdits[att.id] || normalizeStatus(att.status)}
            isExtra={att.is_extra_participant}
            onStatusChange={onStatusChange}
          />
        ))}
        {!attendances.length ? (
          <p className="border-2 border-dashed border-border p-6 text-center text-sm font-medium text-muted">
            Belum ada data peserta pada sesi ini.
          </p>
        ) : null}
      </div>
    </div>
  );
}
