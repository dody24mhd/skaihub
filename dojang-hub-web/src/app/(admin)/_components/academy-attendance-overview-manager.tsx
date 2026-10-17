"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  TrainingClass,
  TrainingSession,
  getAkademiClasses,
  getAkademiTrainingSessions,
} from "../_lib/admin-api";
import AttendanceCalendarMobile from "./attendance/attendance-calendar-mobile";
import AttendanceCalendarDesktop from "./attendance/attendance-calendar-desktop";
import AttendanceHistoryList from "./attendance/attendance-history-list";
import { useCanWrite } from "./ui/subscription-status";
import Icon from "./ui/icon";
import StatusMessage from "./ui/status-message";

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
  return (
    date.getFullYear() === activeMonth.getFullYear() &&
    date.getMonth() === activeMonth.getMonth()
  );
}

function monthTitle(date: Date) {
  return `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function shortTime(value: string) {
  return value?.slice(0, 5) || "";
}

type OpenAttendanceLinkProps = {
  canWrite: boolean;
  className: string;
  children: ReactNode;
};

function OpenAttendanceLink({ canWrite, className, children }: OpenAttendanceLinkProps) {
  if (!canWrite) {
    return (
      <button type="button" disabled className={`${className} cursor-not-allowed opacity-50`}>
        {children}
      </button>
    );
  }

  return (
    <Link href={`/academy/attendance/new?date=${formatLocalDate(new Date())}`} className={className}>
      {children}
    </Link>
  );
}

export default function AcademyAttendanceOverviewManager() {
  const canWrite = useCanWrite();
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
        [
          session.class?.name,
          session.coach?.name,
          ...(session.coaches || []).map((coach) => coach.name),
          session.material,
          session.notes,
        ]
          .filter(Boolean)
          .some((val) => val?.toLowerCase().includes(keyword));
      const matchesClass =
        classFilter === "all" || String(session.class_id) === classFilter;
      const matchesType =
        typeFilter === "all" || session.session_type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter;

      return matchesKeyword && matchesClass && matchesType && matchesStatus;
    });
  }, [classFilter, query, sessions, statusFilter, typeFilter]);

  const monthSessions = useMemo(
    () =>
      filteredSessions
        .filter((session) => {
          const sessionDate = new Date(session.session_date);
          return (
            sessionDate.getFullYear() === calendarMonth.getFullYear() &&
            sessionDate.getMonth() === calendarMonth.getMonth()
          );
        })
        .sort((a, b) => {
          const dateOrder = b.session_date.localeCompare(a.session_date);
          return dateOrder || shortTime(b.starts_at).localeCompare(shortTime(a.starts_at));
        }),
    [calendarMonth, filteredSessions]
  );

  const calendarDays = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startOffset = (scheduleDayFromDate(start) + 6) % 7;
    const dates: Date[] = [];

    for (let index = 0; index < startOffset; index += 1) {
      dates.push(
        new Date(start.getFullYear(), start.getMonth(), start.getDate() - startOffset + index)
      );
    }

    for (let day = 1; day <= end.getDate(); day += 1) {
      dates.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }

    while (dates.length % 7 !== 0) {
      const lastDate = dates[dates.length - 1];
      dates.push(
        new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1)
      );
    }

    return dates.map((date) => {
      const dateKey = formatLocalDate(date);
      return {
        date,
        sessions: filteredSessions
          .filter((session) => session.session_date.slice(0, 10) === dateKey)
          .sort((a, b) => shortTime(a.starts_at).localeCompare(shortTime(b.starts_at))),
      };
    });
  }, [calendarMonth, filteredSessions]);

  async function loadData(activeToken: string) {
    const [sessionData, classData] = await Promise.all([
      getAkademiTrainingSessions(activeToken, { per_page: 200 }),
      getAkademiClasses(activeToken),
    ]);

    const sessionList = sessionData.data?.data || (Array.isArray(sessionData.data) ? sessionData.data : []);
    setSessions(sessionList);
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
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Gagal memuat absensi.")
        )
        .finally(() => setIsLoading(false));
    });
  }, []);

  function changeCalendarMonth(offset: number) {
    setTablePage(1);
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  function updateTableFilter(update: () => void) {
    setTablePage(1);
    update();
  }

  if (isLoading) return <p className="text-sm font-medium text-muted">Memuat absensi...</p>;

  return (
    <div className="space-y-6">
      {/* SECTION KALENDER */}
      <section className="border-2 border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 bg-secondary" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
                Kalender
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-primary">
              Kalender Absensi Aktual
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OpenAttendanceLink
              canWrite={canWrite}
              className="min-h-11 inline-flex items-center justify-center border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90"
            >
              + Sesi Tambahan
            </OpenAttendanceLink>

            <div className="flex items-center border-2 border-border">
              <button
                type="button"
                onClick={() => changeCalendarMonth(-1)}
                aria-label="Bulan sebelumnya"
                className="min-h-11 flex size-11 items-center justify-center text-primary transition hover:bg-surface-container-low"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              <p className="min-w-32 px-2 text-center text-xs font-black uppercase tracking-wider text-primary sm:min-w-36 sm:text-sm">
                {monthTitle(calendarMonth)}
              </p>
              <button
                type="button"
                onClick={() => changeCalendarMonth(1)}
                aria-label="Bulan berikutnya"
                className="min-h-11 flex size-11 items-center justify-center text-primary transition hover:bg-surface-container-low"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
          </div>
        </div>

        <StatusMessage tone="error" message={error} className="mt-4" />

        {/* Filter Input */}
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="min-h-11 w-full border border-border-strong bg-white px-3.5 text-sm text-primary placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary"
            placeholder="Cari absensi"
            value={query}
            onChange={(e) => updateTableFilter(() => setQuery(e.target.value))}
          />
          <select
            className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            value={classFilter}
            onChange={(e) => updateTableFilter(() => setClassFilter(e.target.value))}
          >
            <option value="all">Semua kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            value={typeFilter}
            onChange={(e) => updateTableFilter(() => setTypeFilter(e.target.value))}
          >
            <option value="all">Semua tipe</option>
            <option value="regular">Reguler</option>
            <option value="replacement">Pengganti</option>
            <option value="extra">Tambahan</option>
          </select>
          <select
            className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => updateTableFilter(() => setStatusFilter(e.target.value))}
          >
            <option value="all">Semua status</option>
            <option value="draft">Draft</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
            <option value="rescheduled">Dipindah</option>
          </select>
        </div>

        {/* Tampilan Desktop: Grid 7 Kolom (Tidak Regresi Desktop) */}
        <AttendanceCalendarDesktop
          calendarDays={calendarDays}
          calendarMonth={calendarMonth}
          formatLocalDate={formatLocalDate}
          sameMonth={sameMonth}
          shortTime={shortTime}
          dayLabels={dayLabels}
          sessionTypeLabels={sessionTypeLabels}
          sessionTypeStyles={sessionTypeStyles}
        />

        {/* Tampilan Mobile: Kartu Sesi per Bulan (Tanpa Horizontal Scroll) */}
        <div className="mt-5 md:hidden">
          <AttendanceCalendarMobile
            sessions={monthSessions}
            activeMonthLabel={monthTitle(calendarMonth)}
          />
        </div>
      </section>

      {/* SECTION RIWAYAT (TABEL RESPONSIVE) */}
      <section className="border-2 border-border bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 bg-secondary" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
                Riwayat
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-primary">
              Tabel Absensi {monthTitle(calendarMonth)}
            </h2>
          </div>
          <OpenAttendanceLink
            canWrite={canWrite}
            className="min-h-11 inline-flex items-center justify-center border-2 border-border bg-white px-4 text-sm font-bold text-primary transition hover:border-primary hover:bg-surface-container-low"
          >
            Sesi Tambahan
          </OpenAttendanceLink>
        </div>

        <AttendanceHistoryList
          sessions={monthSessions}
          page={tablePage}
          onPageChange={setTablePage}
        />
      </section>
    </div>
  );
}
