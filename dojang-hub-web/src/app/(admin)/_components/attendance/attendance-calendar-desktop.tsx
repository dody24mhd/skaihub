"use client";

import Link from "next/link";
import React from "react";
import { TrainingSession } from "../../_lib/admin-api";

export type CalendarDay = {
  date: Date;
  sessions: TrainingSession[];
};

export type AttendanceCalendarDesktopProps = {
  calendarDays: CalendarDay[];
  calendarMonth: Date;
  formatLocalDate: (date: Date) => string;
  sameMonth: (date: Date, activeMonth: Date) => boolean;
  shortTime: (val: string) => string;
  dayLabels: string[];
  sessionTypeLabels: Record<TrainingSession["session_type"], string>;
  sessionTypeStyles: Record<TrainingSession["session_type"], string>;
};

export default function AttendanceCalendarDesktop({
  calendarDays,
  calendarMonth,
  formatLocalDate,
  sameMonth,
  shortTime,
  dayLabels,
  sessionTypeLabels,
  sessionTypeStyles,
}: AttendanceCalendarDesktopProps) {
  return (
    <div className="mt-5 hidden overflow-x-auto md:block">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-7 border-l border-t border-border text-xs font-bold uppercase text-muted">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="border-b border-r border-border bg-surface-container-low px-2 py-2 text-center"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-border">
          {calendarDays.map(({ date, sessions: daySessions }) => (
            <div
              key={date.toISOString()}
              className={`min-h-32 border-b border-r border-border p-2 text-left ${
                sameMonth(date, calendarMonth)
                  ? "bg-white"
                  : "bg-surface-container-low/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-xs font-black ${
                    sameMonth(date, calendarMonth)
                      ? "text-primary"
                      : "text-muted/80"
                  }`}
                >
                  {date.getDate()}
                </p>
                <Link
                  className="text-xs font-bold text-secondary hover:underline"
                  href={`/academy/attendance/new?date=${formatLocalDate(date)}`}
                >
                  +
                </Link>
              </div>
              <div className="mt-2 space-y-1">
                {daySessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    className={`block rounded-xs border px-2 py-1 text-[11px] leading-4 transition hover:opacity-90 ${
                      sessionTypeStyles[session.session_type]
                    }`}
                    href={`/academy/attendance/new?session=${session.id}`}
                  >
                    <p className="font-black">
                      {shortTime(session.starts_at)} - {shortTime(session.ends_at)} ·{" "}
                      {sessionTypeLabels[session.session_type]}
                    </p>
                    <p className="truncate">{session.class?.name || "-"}</p>
                  </Link>
                ))}
                {daySessions.length > 3 ? (
                  <p className="text-[11px] font-bold text-secondary">
                    +{daySessions.length - 3} absensi
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
