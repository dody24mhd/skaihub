"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AkademiDashboardSummary, AdminUser, getAkademiDashboardSummary } from "../_lib/admin-api";

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

  if (isLoading) return <p className="text-sm text-muted">Memuat dashboard akademi...</p>;

  if (!summary) {
    return <p className="rounded-md border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">{error}</p>;
  }

  const role = summary.profile.user.role;

  return (
    <div className="space-y-6">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div>
            <p className="label-caps text-secondary">{roleTitle(role)}</p>
            <h2 className="mt-2 font-heading text-2xl font-black text-primary">{summary.profile.akademi.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {summary.period.month_label} - Paket {summary.profile.akademi.plan} - {summary.profile.akademi.sport_type}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase text-muted">Kuota siswa</p>
            <p className="mt-2 text-2xl font-black text-primary">{summary.students?.active_count ?? "-"}</p>
            <p className="text-sm text-muted">Limit {summary.profile.entitlements.student_limit || "-"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Siswa Aktif</p>
          <p className="mt-2 text-3xl font-black text-primary">{summary.students?.active_count || 0}</p>
          <p className="text-sm text-muted">siswa aktif terdaftar</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Sesi Bulan Ini</p>
          <p className="mt-2 text-3xl font-black text-primary">{summary.sessions.month_count}</p>
          <p className="text-sm text-muted">{summary.sessions.completed_count} selesai</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Penilaian Aktif</p>
          <p className="mt-2 text-2xl font-black text-primary">{summary.evaluation.active_period?.name || "-"}</p>
          <p className="text-sm text-muted">{summary.evaluation.active_scores_count} nilai masuk</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shortcutItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card-soft flex min-h-36 flex-col justify-between rounded-lg bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]"
            >
              <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div>
                <h2 className="mt-5 font-heading text-lg font-bold text-primary">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              </div>
            </Link>
          ))}
      </section>

      <section>
        <article className="card-soft rounded-lg bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-primary">Sesi Latihan Terbaru</h2>
          <div className="mt-4 divide-y divide-border">
            {summary.sessions.latest.map((item) => (
              <div key={item.id} className="py-3">
                <p className="font-bold text-primary">{item.class?.name || "-"}</p>
                <p className="text-xs text-muted">
                  {item.session_date.slice(0, 10)}, {time(item.starts_at)} - {time(item.ends_at)}
                </p>
                <p className="mt-1 text-xs font-bold text-secondary">{item.coach?.name || "Tanpa pelatih"}</p>
              </div>
            ))}
            {!summary.sessions.latest.length ? <p className="py-4 text-sm text-muted">Belum ada sesi latihan bulan ini.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
