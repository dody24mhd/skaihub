"use client";

import React from "react";
import { AttendanceStatus } from "../../_lib/admin-api";

export type AttendanceStudentCardProps = {
  attendanceId: number;
  studentName: string;
  rankName?: string | null;
  status: AttendanceStatus;
  isExtra?: boolean;
  onStatusChange: (attendanceId: number, status: AttendanceStatus) => void;
  className?: string;
};

const STATUS_CONFIG: Array<{
  status: AttendanceStatus;
  label: string;
  activeClass: string;
}> = [
  {
    status: "present",
    label: "Hadir",
    activeClass: "bg-success-strong text-white border-success-strong shadow-sm",
  },
  {
    status: "excused",
    label: "Izin",
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm",
  },
  {
    status: "sick",
    label: "Sakit",
    activeClass: "bg-amber-700 text-white border-amber-700 shadow-sm",
  },
  {
    status: "absent",
    label: "Alpa",
    activeClass: "bg-secondary text-white border-secondary shadow-sm",
  },
];

export default function AttendanceStudentCard({
  attendanceId,
  studentName,
  rankName,
  status,
  isExtra = false,
  onStatusChange,
  className = "",
}: AttendanceStudentCardProps) {
  return (
    <div
      data-testid={`attendance-card-${attendanceId}`}
      className={`border-2 border-border bg-white p-3.5 transition ${className}`}
    >
      {/* Header Siswa */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold text-primary">
            {studentName}
          </p>
          {rankName ? (
            <p className="text-xs font-semibold text-muted">{rankName}</p>
          ) : null}
        </div>
        {isExtra ? (
          <span className="shrink-0 rounded bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">
            Tambahan
          </span>
        ) : null}
      </div>

      {/* 4 Tombol Status Besar (Muat 375px, Touch Target >= 44px) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {STATUS_CONFIG.map((item) => {
          const isActive = status === item.status;
          return (
            <button
              key={item.status}
              type="button"
              disabled={isExtra}
              aria-pressed={isActive}
              aria-label={`${item.label} - ${studentName}`}
              onClick={() => onStatusChange(attendanceId, item.status)}
              className={`min-h-11 flex w-full items-center justify-center border text-xs sm:text-sm font-bold transition focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? item.activeClass
                  : "border-border bg-surface-container-low/40 text-primary hover:border-primary/40 hover:bg-white active:bg-surface-container"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
