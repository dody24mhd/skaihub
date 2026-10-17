"use client";

import Link from "next/link";
import { useState } from "react";
import TodaySlotCard from "./today-slot-card";
import { formatLocalDate } from "./today-utils";
import { useAdminSession, useOpenSlot, useTodaySlots } from "./use-today-slots";

const DASHBOARD_SLOT_LIMIT = 3;

export default function TodayClassesCard() {
  const { token, isReady } = useAdminSession();
  const [todayKey] = useState(() => formatLocalDate(new Date()));
  const { slots, isLoading, error, reload } = useTodaySlots(token, todayKey, isReady);
  const { busyKey, openError, openSlot } = useOpenSlot(token);

  return (
    <section className="border-2 border-border bg-white p-4 sm:p-6" aria-labelledby="dashboard-today-classes">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-1 w-6 bg-secondary" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">Hari Ini</span>
          </div>
          <h2 id="dashboard-today-classes" className="font-heading text-lg font-bold uppercase tracking-tight text-primary">
            Kelas Hari Ini
          </h2>
        </div>
        <Link href="/academy/attendance" className="inline-flex min-h-11 items-center text-xs font-bold text-secondary hover:underline">
          Lihat Semua
        </Link>
      </div>

      {error || openError ? (
        <div role="alert" className="mb-3 flex flex-col gap-2 border-2 border-secondary/30 bg-secondary/10 p-3 text-sm font-bold text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>{error || openError}</span>
          {error ? (
            <button type="button" onClick={() => void reload()} className="min-h-11 border-2 border-secondary bg-white px-4 text-secondary">
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm font-medium text-muted">Memuat kelas...</p>
      ) : !error && slots.length === 0 ? (
        <p className="border-2 border-dashed border-border p-6 text-center text-sm font-medium text-muted">
          Tidak ada jadwal latihan hari ini.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.slice(0, DASHBOARD_SLOT_LIMIT).map((slot) => (
            <TodaySlotCard key={slot.key} slot={slot} isBusy={busyKey === slot.key} onOpen={openSlot} />
          ))}
        </div>
      )}
    </section>
  );
}
