"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AkademiDashboardSummary, AdminUser, getAkademiDashboardSummary } from "../_lib/admin-api";
import TodayClassesCard from "./sessions/today-classes-card";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const shortcutItems = [
  { title: "Siswa", href: "/academy/students", icon: "badge", description: "Data siswa dan histori perkembangan.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Akun Akademi", href: "/academy/users", icon: "manage_accounts", description: "Pengurus akademi dan pelatih.", roles: ["ketua_akademi", "admin_akademi"] },
  { title: "Sabuk / Tingkatan", href: "/academy/ranks", icon: "military_tech", description: "Master sabuk atau level siswa.", roles: ["ketua_akademi", "admin_akademi"] },
  { title: "Format Penilaian", href: "/academy/evaluation-settings", icon: "rule_settings", description: "Periode dan variabel raport.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Kelas / Unit", href: "/academy/classes", icon: "groups", description: "Kelompok latihan dan Iuran SPP.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Jadwal", href: "/academy/schedules", icon: "calendar_month", description: "Jadwal reguler dan pelatih.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Absensi", href: "/academy/attendance", icon: "fact_check", description: "Kehadiran dan berita acara latihan.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Penilaian", href: "/academy/evaluations", icon: "grading", description: "Input nilai dan rekap raport.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "SPP / Iuran", href: "/academy/spp", icon: "payments", description: "Tagihan dan pembayaran siswa.", roles: ["ketua_akademi", "admin_akademi"] },
  { title: "Kenaikan Tingkat", href: "/academy/rank-promotions", icon: "military_tech", description: "Event UKT dan update sabuk.", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
  { title: "Tempat Latihan", href: "/academy/places", icon: "location_on", description: "Lokasi latihan akademi.", roles: ["ketua_akademi", "admin_akademi"] },
];

function roleTitle(role: AdminUser["role"]) {
  if (role === "ketua_akademi") return "Monitoring Ketua";
  if (role === "admin_akademi") return "Operasional Pengurus";
  return "Ruang Pelatih";
}

function time(value: string) {
  return value?.slice(0, 5) || "-";
}

export default function AcademyDashboardManager() {
  const tokenRef = useRef("");
  const [summary, setSummary] = useState<AkademiDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      getAkademiDashboardSummary(activeToken)
        .then(setSummary)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat dashboard akademi."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  if (isLoading) return <p className="text-sm font-medium text-muted">Memuat dashboard akademi...</p>;

  if (!summary) {
    return <p className="border-2 border-secondary/30 bg-secondary/10 p-4 text-sm font-bold text-secondary">{error}</p>;
  }

  const role = summary.profile.user.role;

  return (
    <div className="space-y-6">
      {/* Header Info Akademi */}
      <section className="border-2 border-border bg-white p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 bg-secondary" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
                {roleTitle(role)}
              </span>
            </div>
            <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
              {summary.profile.akademi.name}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {summary.period.month_label} · Paket {summary.profile.akademi.plan} · {summary.profile.akademi.sport_type}
            </p>
          </div>
          <div className="border border-border bg-surface-container-low p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">Kuota Siswa</span>
            <p className="mt-1 font-heading text-2xl font-black text-primary">{summary.students?.active_count ?? "-"}</p>
            <p className="text-xs text-muted">Limit {summary.profile.entitlements.student_limit || "-"}</p>
          </div>
        </div>
      </section>

      <TodayClassesCard />

      {/* Ringkasan Statistik */}
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="border-2 border-border bg-white p-4 sm:p-5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">Siswa Aktif</span>
          <p className="mt-1 font-heading text-3xl font-black text-primary">{summary.students?.active_count ?? "-"}</p>
          <p className="mt-1 text-xs text-muted">{summary.students ? "siswa aktif terdaftar" : "tidak ditampilkan untuk pelatih"}</p>
        </article>
        <article className="border-2 border-border bg-white p-4 sm:p-5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">Sesi Bulan Ini</span>
          <p className="mt-1 font-heading text-3xl font-black text-primary">{summary.sessions.month_count}</p>
          <p className="mt-1 text-xs text-muted">{summary.sessions.completed_count} selesai</p>
        </article>
        <article className="border-2 border-border bg-white p-4 sm:p-5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">Penilaian Aktif</span>
          <p className="mt-1 truncate font-heading text-xl font-black text-primary">{summary.evaluation.active_period?.name || "-"}</p>
          <p className="mt-1 text-xs text-muted">{summary.evaluation.active_scores_count} nilai masuk</p>
        </article>
      </section>

      {/* Shortcut Menu */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcutItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-28 flex-col justify-between border-2 border-border bg-white p-4 transition hover:border-primary/40 hover:shadow-md active:bg-surface-container-low"
            >
              <div className="flex size-11 items-center justify-center border border-primary/20 bg-primary/10 text-primary">
                <Icon name={item.icon} className="text-[24px]" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-base font-bold uppercase tracking-tight text-primary">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">{item.description}</p>
              </div>
            </Link>
          ))}
      </section>

      {/* Sesi Latihan Terbaru (Kartu Mobile) */}
      <section>
        <article className="border-2 border-border bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1 w-6 bg-secondary" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
                  Aktivitas
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-primary">
                Sesi Latihan Terbaru
              </h2>
            </div>
            <Link
              href="/academy/attendance"
              className="text-xs font-bold text-secondary hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.sessions.latest.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between border-2 border-border bg-white p-3.5 transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">
                      {item.session_date.slice(0, 10)}
                    </span>
                    <span className="text-xs text-muted">
                      {time(item.starts_at)} - {time(item.ends_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-heading text-base font-bold text-primary truncate">
                    {item.class?.name || "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-secondary">
                    {item.coach?.name || "Tanpa pelatih"}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border">
                  <Link
                    href={`/academy/attendance/new?session=${item.id}`}
                    className="min-h-11 inline-flex w-full items-center justify-center border-2 border-border bg-white text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container-low"
                  >
                    Buka Absensi
                  </Link>
                </div>
              </div>
            ))}
            {!summary.sessions.latest.length ? (
              <p className="col-span-full border-2 border-dashed border-border p-6 text-center text-sm font-medium text-muted">
                Belum ada sesi latihan bulan ini.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
