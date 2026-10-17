"use client";

import { TodaySlot } from "../../_lib/admin-api";
import { SLOT_STATUS_LABELS, SLOT_STATUS_STYLES, canOpenSlot } from "./today-utils";
import Icon from "../ui/icon";

const SESSION_TYPE_LABELS: Record<TodaySlot["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

export type TodaySlotCardProps = {
  slot: TodaySlot;
  isBusy: boolean;
  onOpen: (slot: TodaySlot) => void;
  onMenu?: (slot: TodaySlot) => void;
  /** Mode baca-saja (L4-D): slot yang belum dibuka tidak boleh membuat sesi baru. */
  canWrite?: boolean;
};

function slotNote(slot: TodaySlot): string | null {
  if (slot.status === "rescheduled" && slot.rescheduled_to) {
    return `Dipindah ke ${slot.rescheduled_to.session_date} ${slot.rescheduled_to.starts_at}${slot.reschedule_reason ? ` · ${slot.reschedule_reason}` : ""}`;
  }
  if (slot.status === "cancelled") return `Dibatalkan${slot.cancel_reason ? ` · ${slot.cancel_reason}` : ""}`;
  if (slot.rescheduled_from) {
    return `Pengganti sesi ${slot.rescheduled_from.session_date} ${slot.rescheduled_from.starts_at}`;
  }
  return null;
}

function actionLabel(slot: TodaySlot, isBusy: boolean): string {
  if (isBusy) return "Membuka...";
  if (slot.status === "cancelled") return "Sesi Dibatalkan";
  if (slot.status === "not_opened") return "Buka Absensi";
  if (slot.status === "rescheduled") return "Lihat Sesi Pengganti";
  if (slot.status === "completed") return "Lihat Absensi";
  return "Lanjutkan Absensi";
}

export default function TodaySlotCard({ slot, isBusy, onOpen, onMenu, canWrite = true }: TodaySlotCardProps) {
  const note = slotNote(slot);
  const showCounts = Boolean(slot.session_id) && slot.status !== "rescheduled" && slot.status !== "cancelled";

  return (
    <article
      data-testid={`today-slot-${slot.key}`}
      className="flex flex-col justify-between border-2 border-border bg-white p-4 transition hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">
            {slot.starts_at} - {slot.ends_at} · {SESSION_TYPE_LABELS[slot.session_type]}
          </p>
          <h3 className="mt-1 truncate font-heading text-base font-bold uppercase tracking-tight text-primary">
            {slot.class_name || "Kelas"}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">{slot.place_name || "Tempat belum diatur"}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-secondary">
            {slot.coach_names.length ? slot.coach_names.join(", ") : "Tanpa pelatih"}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <span
            className={`inline-flex h-7 items-center border px-2 text-[11px] font-bold uppercase ${SLOT_STATUS_STYLES[slot.status]}`}
          >
            {SLOT_STATUS_LABELS[slot.status]}
          </span>
          {onMenu ? (
            <button
              type="button"
              onClick={() => onMenu(slot)}
              aria-label={`Aksi sesi ${slot.class_name || "kelas"} ${slot.starts_at}`}
              className="inline-flex size-11 items-center justify-center border border-border bg-white text-primary transition hover:bg-surface-container-low focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <Icon name="more_horiz" className="text-[20px]" />
            </button>
          ) : null}
        </div>
      </div>

      {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
      {showCounts ? (
        <p className="mt-2 text-xs font-semibold text-primary">
          Hadir {slot.present_count}/{slot.attendances_count}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canOpenSlot(slot) || isBusy || (!canWrite && slot.status === "not_opened")}
        onClick={() => onOpen(slot)}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center border-2 border-primary bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-container disabled:text-muted"
      >
        {actionLabel(slot, isBusy)}
      </button>
    </article>
  );
}
