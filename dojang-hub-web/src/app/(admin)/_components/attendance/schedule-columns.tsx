import React from "react";
import { TrainingSchedule } from "../../_lib/admin-api";
import { ResponsiveColumn } from "../ui";

export const dayLabels: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

export function shortTime(val: string) {
  return val?.slice(0, 5) || "";
}

export function buildScheduleColumns({
  canManage,
  onEdit,
  onDelete,
}: {
  canManage: boolean;
  onEdit: (item: TrainingSchedule) => void;
  onDelete: (item: TrainingSchedule) => void;
}): ResponsiveColumn<TrainingSchedule>[] {
  return [
    {
      key: "day",
      header: "Hari",
      primary: true,
      render: (row) => (
        <span className="font-bold text-primary">
          {dayLabels[row.day_of_week]}
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
      key: "class_name",
      header: "Kelas",
      render: (row) => (
        <span className="font-semibold text-primary">
          {row.class?.name || "-"}
        </span>
      ),
    },
    {
      key: "place",
      header: "Tempat",
      render: (row) => (
        <span className="text-muted">
          {row.training_place?.name || row.class?.training_place?.name || "-"}
        </span>
      ),
    },
    {
      key: "coach",
      header: "Pelatih",
      render: (row) => (
        <span className="text-muted">
          {row.coaches?.length
            ? row.coaches.map((c) => c.name).join(", ")
            : row.coach?.name || "Belum dipilih"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-bold ${
            row.is_active
              ? "bg-success/10 text-success border border-success/30"
              : "bg-surface-container text-muted"
          }`}
        >
          {row.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "action",
            header: "Aksi",
            className: "text-right",
            headerClassName: "text-right",
            render: (row: TrainingSchedule) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="min-h-11 inline-flex items-center justify-center border-2 border-border bg-white px-3 py-1 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container-low"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="min-h-11 inline-flex items-center justify-center border-2 border-secondary/30 bg-white px-3 py-1 text-xs font-bold text-secondary transition hover:bg-secondary/10"
                >
                  Hapus
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];
}
