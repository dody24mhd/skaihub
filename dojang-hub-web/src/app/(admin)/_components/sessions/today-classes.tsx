"use client";

import Link from "next/link";
import { useState } from "react";
import { TodaySlot } from "../../_lib/admin-api";
import SessionActionSheets, { SessionAction } from "./session-action-sheets";
import { useCanWrite } from "../ui/subscription-status";
import TodaySlotCard from "./today-slot-card";
import { addDays, canManageSlot, dateBounds, dateLabel, formatLocalDate, isAdminRole } from "./today-utils";
import { useAdminSession, useOpenSlot, useTodaySlots } from "./use-today-slots";
import Icon from "../ui/icon";
import StatusMessage from "../ui/status-message";

const navButtonClass =
  "inline-flex size-11 items-center justify-center border-2 border-border bg-white text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:text-muted/50";

export default function TodayClasses() {
  const { token, role, isReady } = useAdminSession();
  const canWrite = useCanWrite();
  const [todayKey] = useState(() => formatLocalDate(new Date()));
  const [date, setDate] = useState(todayKey);
  const { slots, backfillDays, isLoading, error, reload } = useTodaySlots(token, date, isReady);
  const { busyKey, openError, openSlot } = useOpenSlot(token);
  const [menuSlot, setMenuSlot] = useState<TodaySlot | null>(null);
  const [action, setAction] = useState<SessionAction | null>(null);
  const [message, setMessage] = useState("");

  const isAdmin = isAdminRole(role);
  const bounds = dateBounds(todayKey, backfillDays, isAdmin);
  const canGoBack = !bounds.min || date > bounds.min;
  const canGoForward = !bounds.max || date < bounds.max;

  function changeDate(next: string) {
    if (!next) return;
    if (bounds.min && next < bounds.min) return;
    if (bounds.max && next > bounds.max) return;
    setMessage("");
    setDate(next);
  }

  function openMenu(slot: TodaySlot) {
    setMenuSlot(slot);
    setAction("menu");
  }

  function handleActionChange(next: SessionAction | null) {
    setAction(next);
    if (!next) setMenuSlot(null);
  }

  function handleDone(doneMessage: string) {
    setMessage(doneMessage);
    void reload();
  }

  return (
    <section className="border-2 border-border bg-white p-4 sm:p-6" aria-labelledby="today-classes-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 bg-secondary" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">{dateLabel(date, todayKey)}</span>
          </div>
          <h2 id="today-classes-title" className="font-heading text-xl font-bold uppercase tracking-tight text-primary">
            Kelas Hari Ini
          </h2>
        </div>
        {isAdmin && canWrite ? (
          <Link
            href={`/academy/attendance/new?date=${date}`}
            className="inline-flex min-h-11 items-center justify-center border-2 border-primary bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container"
          >
            + Sesi Tambahan
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" aria-label="Hari sebelumnya" disabled={!canGoBack} onClick={() => changeDate(addDays(date, -1))} className={navButtonClass}>
          <Icon name="chevron_left" className="text-[20px]" />
        </button>
        <label htmlFor="today-classes-date" className="sr-only">Tanggal latihan</label>
        <input
          id="today-classes-date"
          type="date"
          value={date}
          min={bounds.min}
          max={bounds.max}
          onChange={(event) => changeDate(event.target.value)}
          className="min-h-11 min-w-0 flex-1 border-2 border-border bg-white px-3 text-base text-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:max-w-56 sm:text-sm"
        />
        <button type="button" aria-label="Hari berikutnya" disabled={!canGoForward} onClick={() => changeDate(addDays(date, 1))} className={navButtonClass}>
          <Icon name="chevron_right" className="text-[20px]" />
        </button>
        {date !== todayKey ? (
          <button type="button" onClick={() => changeDate(todayKey)} className="min-h-11 border-2 border-border px-3 text-sm font-bold text-primary hover:bg-surface-container-low">
            Hari ini
          </button>
        ) : null}
      </div>
      {!isAdmin ? (
        <p className="mt-2 text-xs text-muted">Pelatih bisa mengisi absensi hingga {backfillDays} hari ke belakang.</p>
      ) : null}

      <StatusMessage tone="success" message={message} className="mt-4" />
      <StatusMessage tone="error" message={error || openError} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {error ? (
          <button type="button" onClick={() => void reload()} className="min-h-11 border-2 border-secondary bg-white px-4 text-secondary">
            Coba lagi
          </button>
        ) : null}
      </StatusMessage>

      {isLoading ? (
        <p className="mt-6 text-sm font-medium text-muted">Memuat kelas...</p>
      ) : !error && slots.length === 0 ? (
        <p className="mt-6 border-2 border-dashed border-border p-6 text-center text-sm font-medium text-muted">
          Tidak ada jadwal latihan pada tanggal ini.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => (
            <TodaySlotCard
              key={slot.key}
              slot={slot}
              isBusy={busyKey === slot.key}
              onOpen={openSlot}
              onMenu={canWrite && isAdmin && canManageSlot(slot) ? openMenu : undefined}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      <SessionActionSheets token={token} slot={menuSlot} action={action} onActionChange={handleActionChange} onDone={handleDone} />
    </section>
  );
}
