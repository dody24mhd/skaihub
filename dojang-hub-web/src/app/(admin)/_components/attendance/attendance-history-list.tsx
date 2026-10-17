"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import { TrainingSession } from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";
import Icon from "../ui/icon";

export type AttendanceHistoryListProps = {
  sessions: TrainingSession[];
  page: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
};

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

const sessionTypeStyles: Record<TrainingSession["session_type"], string> = {
  regular: "bg-success/10 text-success border-success/30",
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

export default function AttendanceHistoryList({
  sessions,
  page,
  pageSize = 10,
  onPageChange,
}: AttendanceHistoryListProps) {
  const pageCount = Math.max(1, Math.ceil(sessions.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const paginatedSessions = useMemo(
    () => sessions.slice((activePage - 1) * pageSize, activePage * pageSize),
    [activePage, pageSize, sessions]
  );
  const startNumber = sessions.length ? (activePage - 1) * pageSize + 1 : 0;
  const endNumber = Math.min(activePage * pageSize, sessions.length);

  const columns: ResponsiveColumn<TrainingSession>[] = [
    {
      key: "session_date",
      header: "Tanggal",
      primary: true,
      render: (row) => (
        <span className="font-bold text-primary">
          {row.session_date.slice(0, 10)}
        </span>
      ),
    },
    {
      key: "class_name",
      header: "Kelas",
      render: (row) => (
        <span className="font-medium text-primary">
          {row.class?.name || "-"}
        </span>
      ),
    },
    {
      key: "session_type",
      header: "Jenis",
      render: (row) => (
        <span
          className={`inline-flex rounded-sm border px-2 py-0.5 text-xs font-bold ${
            sessionTypeStyles[row.session_type]
          }`}
        >
          {sessionTypeLabels[row.session_type]}
        </span>
      ),
    },
    {
      key: "time",
      header: "Jam",
      render: (row) => (
        <span className="text-muted">
          {shortTime(row.starts_at)} - {shortTime(row.ends_at)}
        </span>
      ),
    },
    {
      key: "attendance_ratio",
      header: "Hadir",
      render: (row) => (
        <span className="font-semibold text-primary">
          {row.present_count || 0}/{row.attendances_count || 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="inline-flex rounded-sm bg-surface-container px-2 py-0.5 text-xs font-bold text-muted">
          {statusLabels[row.status]}
        </span>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) => (
        <Link
          href={`/academy/attendance/new?session=${row.id}`}
          className="min-h-11 inline-flex items-center justify-center border-2 border-border bg-white px-3.5 py-1.5 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container-low"
        >
          Lanjutkan
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResponsiveList
        columns={columns}
        rows={paginatedSessions}
        getRowKey={(row) => row.id}
        ariaLabel="Tabel Riwayat Absensi"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            Belum ada absensi aktual pada periode ini.
          </div>
        }
      />

      {sessions.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-muted">
            Menampilkan {startNumber}-{endNumber} dari {sessions.length} absensi (Halaman {activePage} dari {pageCount})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => onPageChange(Math.max(1, activePage - 1))}
              className="min-h-11 inline-flex items-center gap-1.5 border-2 border-border bg-white px-4 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="chevron_left" className="text-[18px]" />
              Prev
            </button>
            <button
              type="button"
              disabled={activePage >= pageCount}
              onClick={() => onPageChange(Math.min(pageCount, activePage + 1))}
              className="min-h-11 inline-flex items-center gap-1.5 border-2 border-border bg-white px-4 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
