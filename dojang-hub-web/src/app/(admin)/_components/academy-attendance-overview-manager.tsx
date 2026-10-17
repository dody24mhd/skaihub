"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrainingClass,
  TrainingSession,
  getAkademiClasses,
  getAkademiTrainingSessions,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const monthLabels = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const tablePageSize = 10;

const statusLabels: Record<TrainingSession["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Batal",
};

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

const sessionTypeStyles: Record<TrainingSession["session_type"], string> = {
  regular: "bg-success/10 text-success",
  replacement: "bg-orange-100 text-orange-700",
  extra: "bg-secondary/10 text-secondary",
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scheduleDayFromDate(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function sameMonth(date: Date, activeMonth: Date) {
  return date.getFullYear() === activeMonth.getFullYear() && date.getMonth() === activeMonth.getMonth();
}

function monthTitle(date: Date) {
  return `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function shortTime(value: string) {
  return value.slice(0, 5);
}

export default function AcademyAttendanceOverviewManager() {
  const tokenRef = useRef("");
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tablePage, setTablePage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredSessions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesKeyword =
        !keyword ||
        [session.class?.name, session.coach?.name, ...(session.coaches || []).map((coach) => coach.name), session.material, session.notes]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(keyword));
      const matchesClass = classFilter === "all" || String(session.class_id) === classFilter;
      const matchesType = typeFilter === "all" || session.session_type === typeFilter;
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;

      return matchesKeyword && matchesClass && matchesType && matchesStatus;
    });
  }, [classFilter, query, sessions, statusFilter, typeFilter]);

  const tableSessions = useMemo(
    () => filteredSessions
      .filter((session) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate.getFullYear() === calendarMonth.getFullYear() && sessionDate.getMonth() === calendarMonth.getMonth();
      })
      .sort((first, second) => {
        const dateOrder = second.session_date.localeCompare(first.session_date);
        return dateOrder || shortTime(second.starts_at).localeCompare(shortTime(first.starts_at));
      }),
    [calendarMonth, filteredSessions],
  );

  const calendarDays = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startOffset = (scheduleDayFromDate(start) + 6) % 7;
    const dates: Date[] = [];

    for (let index = 0; index < startOffset; index += 1) {
      dates.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() - startOffset + index));
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      dates.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }

    while (dates.length % 7 !== 0) {
      const lastDate = dates[dates.length - 1];
      dates.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1));
    }

    return dates.map((date) => {
      const dateKey = formatLocalDate(date);
      return {
        date,
        sessions: filteredSessions
          .filter((session) => session.session_date.slice(0, 10) === dateKey)
          .sort((first, second) => shortTime(first.starts_at).localeCompare(shortTime(second.starts_at))),
      };
    });
  }, [calendarMonth, filteredSessions]);

  const tablePageCount = Math.max(1, Math.ceil(tableSessions.length / tablePageSize));
  const activeTablePage = Math.min(tablePage, tablePageCount);
  const paginatedTableSessions = useMemo(
    () => tableSessions.slice((activeTablePage - 1) * tablePageSize, activeTablePage * tablePageSize),
    [activeTablePage, tableSessions],
  );
  const tableStartNumber = tableSessions.length ? (activeTablePage - 1) * tablePageSize + 1 : 0;
  const tableEndNumber = Math.min(activeTablePage * tablePageSize, tableSessions.length);

  async function loadData(activeToken: string) {
    const [sessionData, classData] = await Promise.all([
      getAkademiTrainingSessions(activeToken, { per_page: 200 }),
      getAkademiClasses(activeToken),
    ]);

    setSessions(sessionData.data.data);
    setClasses(classData.data.filter((item) => item.is_active));
  }

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      loadData(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat absensi."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function changeCalendarMonth(offset: number) {
    setTablePage(1);
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function updateTableFilter(update: () => void) {
    setTablePage(1);
    update();
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat absensi...</p>;

  return (
    <div className="space-y-6">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Kalender</p>
            <h2 className="font-heading text-xl font-bold text-primary">Kalender Absensi Aktual</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container" href={`/academy/attendance/new?date=${formatLocalDate(new Date())}`}>
              Absensi Latihan
            </Link>
            <button className="flex size-10 items-center justify-center rounded-md border border-border text-primary" onClick={() => changeCalendarMonth(-1)} type="button" aria-label="Bulan sebelumnya">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <p className="min-w-36 text-center text-sm font-black uppercase text-primary">{monthTitle(calendarMonth)}</p>
            <button className="flex size-10 items-center justify-center rounded-md border border-border text-primary" onClick={() => changeCalendarMonth(1)} type="button" aria-label="Bulan berikutnya">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 grid gap-2 lg:grid-cols-4">
          <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari absensi" value={query} onChange={(event) => updateTableFilter(() => setQuery(event.target.value))} />
          <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={classFilter} onChange={(event) => updateTableFilter(() => setClassFilter(event.target.value))}>
            <option value="all">Semua kelas</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={typeFilter} onChange={(event) => updateTableFilter(() => setTypeFilter(event.target.value))}>
            <option value="all">Semua tipe</option>
            <option value="regular">Reguler</option>
            <option value="replacement">Pengganti</option>
            <option value="extra">Tambahan</option>
          </select>
          <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={statusFilter} onChange={(event) => updateTableFilter(() => setStatusFilter(event.target.value))}>
            <option value="all">Semua status</option>
            <option value="draft">Draft</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 border-l border-t border-border text-xs font-bold uppercase text-muted">
              {dayLabels.map((label) => (
                <div key={label} className="border-b border-r border-border bg-surface-container-low px-2 py-2 text-center">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-border">
              {calendarDays.map(({ date, sessions: daySessions }) => (
                <div key={date.toISOString()} className={`min-h-32 border-b border-r border-border p-2 text-left ${sameMonth(date, calendarMonth) ? "bg-white" : "bg-surface-container-low/70"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-black ${sameMonth(date, calendarMonth) ? "text-primary" : "text-muted/60"}`}>{date.getDate()}</p>
                    <Link className="text-xs font-bold text-secondary" href={`/academy/attendance/new?date=${formatLocalDate(date)}`}>+</Link>
                  </div>
                  <div className="mt-2 space-y-1">
                    {daySessions.slice(0, 3).map((session) => (
                      <Link key={session.id} className={`block rounded-md px-2 py-1 text-[11px] leading-4 ${sessionTypeStyles[session.session_type]}`} href={`/academy/attendance/new?session=${session.id}`}>
                        <p className="font-black">{shortTime(session.starts_at)} - {shortTime(session.ends_at)} · {sessionTypeLabels[session.session_type]}</p>
                        <p className="truncate">{session.class?.name || "-"}</p>
                      </Link>
                    ))}
                    {daySessions.length > 3 ? <p className="text-[11px] font-bold text-secondary">+{daySessions.length - 3} absensi</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Riwayat</p>
            <h2 className="font-heading text-xl font-bold text-primary">Tabel Absensi {monthTitle(calendarMonth)}</h2>
            <p className="mt-1 text-sm text-muted">
              Menampilkan {tableStartNumber}-{tableEndNumber} dari {tableSessions.length} absensi. Mengikuti bulan dan filter pada kalender.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary transition hover:bg-surface-container-low" href={`/academy/attendance/new?date=${formatLocalDate(new Date())}`}>
              Buka Absensi Baru
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="w-14 pb-3">No</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Jenis</th>
                <th className="pb-3">Jam</th>
                <th className="pb-3">Hadir</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTableSessions.map((session, index) => (
                <tr key={session.id}>
                  <td className="py-3 font-bold text-muted">{tableStartNumber + index}</td>
                  <td className="py-3 font-bold text-primary">{session.session_date.slice(0, 10)}</td>
                  <td className="py-3 text-muted">{session.class?.name || "-"}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${sessionTypeStyles[session.session_type]}`}>{sessionTypeLabels[session.session_type]}</span>
                  </td>
                  <td className="py-3 text-muted">{shortTime(session.starts_at)} - {shortTime(session.ends_at)}</td>
                  <td className="py-3 text-muted">{session.present_count || 0}/{session.attendances_count || 0}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-bold text-muted">{statusLabels[session.status]}</span>
                  </td>
                  <td className="py-3 text-right">
                    <Link className="rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" href={`/academy/attendance/new?session=${session.id}`}>
                      Lanjutkan
                    </Link>
                  </td>
                </tr>
              ))}
              {!tableSessions.length ? (
                <tr>
                  <td className="py-8 text-sm text-muted" colSpan={8}>Belum ada absensi aktual pada periode ini.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-muted">
            Halaman {activeTablePage} dari {tablePageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeTablePage <= 1}
              onClick={() => setTablePage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Prev
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeTablePage >= tablePageCount}
              onClick={() => setTablePage((current) => Math.min(tablePageCount, current + 1))}
              type="button"
            >
              Next
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
