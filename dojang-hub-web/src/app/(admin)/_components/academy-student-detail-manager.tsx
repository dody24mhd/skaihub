"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  StudentDetailResponse,
  StudentEvaluationScore,
  TrainingAttendance,
  getAkademiStudentDetail,
} from "../_lib/admin-api";
import AcademyRankBeltBadge from "./academy-rank-belt-badge";

const TOKEN_KEY = "skaihub_admin_token";

const attendanceLabels: Record<TrainingAttendance["status"], string> = {
  present: "Hadir",
  absent: "Tidak hadir",
  excused: "Izin",
};

const indicatorLabels: Record<StudentEvaluationScore["indicator"], string> = {
  kurang: "Kurang",
  cukup: "Cukup",
  baik: "Baik",
  sangat_baik: "Sangat baik",
};

const sppStatusLabels: Record<string, string> = {
  unpaid: "Belum lunas",
  partial: "Sebagian",
  paid: "Lunas",
  waived: "Dibebaskan",
};

function money(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function shortDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export default function AcademyStudentDetailManager({ studentId }: { studentId: number }) {
  const tokenRef = useRef("");
  const [data, setData] = useState<StudentDetailResponse | null>(null);
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

      getAkademiStudentDetail(activeToken, studentId)
        .then(setData)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat detail siswa."))
        .finally(() => setIsLoading(false));
    });
  }, [studentId]);

  if (isLoading) return <p className="text-sm text-muted">Memuat detail siswa...</p>;

  if (!data) {
    return (
      <div className="space-y-4">
        <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary" href="/academy/students">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>
        <p className="rounded-md border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">{error}</p>
      </div>
    );
  }

  const {
    student,
    summary,
    attendances,
    spp_bills: sppBills,
    evaluation_scores: evaluationScores,
    rank_promotions: rankPromotions,
  } = data;
  const attendancePercent = summary.attendance_total
    ? Math.round((summary.attendance_present / summary.attendance_total) * 100)
    : 0;
  const latestAttendances = attendances.slice(0, 5);
  const latestSppBills = sppBills.slice(0, 5);
  const latestEvaluationScores = evaluationScores.slice(0, 5);
  const latestRankPromotions = rankPromotions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary" href="/academy/students">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Daftar Siswa
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white" href="/academy/evaluations">
            <span className="material-symbols-outlined text-[18px]">grading</span>
            Input Penilaian
          </Link>
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-bold text-primary" href="/academy/rank-promotions">
            <span className="material-symbols-outlined text-[18px]">military_tech</span>
            Kenaikan Tingkat
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="card-soft rounded-lg bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              {student.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photo_url} alt="" className="size-24 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[44px]">person</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="label-caps text-secondary">Profil Siswa</p>
                <h2 className="mt-2 font-heading text-2xl font-black text-primary">{student.name}</h2>
                <p className="mt-1 text-sm font-semibold text-muted">{student.member_number}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted">{student.primary_class?.name || "Belum masuk kelas"}</span>
                  <AcademyRankBeltBadge rank={student.current_rank} size="md" />
                </div>
              </div>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${student.status === "active" ? "bg-success/10 text-success" : "bg-surface-container text-muted"}`}>
              {student.status === "active" ? "Aktif" : student.status}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <dt className="font-bold text-primary">Kelas utama</dt>
              <dd className="mt-1 text-muted">{student.primary_class?.name || "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Tingkatan</dt>
              <dd className="mt-2">
                <AcademyRankBeltBadge rank={student.current_rank} size="md" />
              </dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Bergabung</dt>
              <dd className="mt-1 text-muted">{shortDate(student.joined_date)}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Fisik</dt>
              <dd className="mt-1 text-muted">{student.height_cm} cm / {Number(student.weight_kg)} kg</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Kontak siswa</dt>
              <dd className="mt-1 text-muted">{student.student_phone || "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Wali</dt>
              <dd className="mt-1 text-muted">{student.guardian_name || "-"} {student.guardian_phone ? `- ${student.guardian_phone}` : ""}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Sekolah</dt>
              <dd className="mt-1 text-muted">{student.school_name || "-"} {student.school_grade ? `(${student.school_grade})` : ""}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Ukuran baju</dt>
              <dd className="mt-1 text-muted">{student.shirt_size || "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-primary">Catatan kesehatan</dt>
              <dd className="mt-1 text-muted">{student.health_notes || "-"}</dd>
            </div>
          </dl>
        </article>

        <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Kehadiran</p>
            <p className="mt-2 text-3xl font-black text-primary">{attendancePercent}%</p>
            <p className="text-sm text-muted">{summary.attendance_present} dari {summary.attendance_total} sesi</p>
          </article>
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">SPP Tertunggak</p>
            <p className="mt-2 text-3xl font-black text-secondary">{summary.spp_unpaid_count}</p>
            <p className="text-sm text-muted">Tagihan belum lunas</p>
          </article>
          <article className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Rata-rata Nilai</p>
            <p className="mt-2 text-3xl font-black text-primary">{summary.evaluation_average || "-"}</p>
            <p className="text-sm text-muted">Dari histori penilaian</p>
          </article>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <article className="card-soft rounded-lg bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-primary">Absensi Terbaru</h2>
          <div className="mt-4 divide-y divide-border">
            {latestAttendances.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{item.session?.class?.name || student.primary_class?.name || "-"}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "present" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                    {attendanceLabels[item.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{shortDate(item.session?.session_date)} - {item.session?.material || "Tanpa materi"}</p>
              </div>
            ))}
            {!attendances.length ? <p className="py-4 text-sm text-muted">Belum ada histori absensi.</p> : null}
            {attendances.length > 5 ? <p className="pt-3 text-xs font-semibold text-muted">Menampilkan 5 data terbaru dari {attendances.length} histori.</p> : null}
          </div>
        </article>

        <article className="card-soft rounded-lg bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-primary">SPP Terbaru</h2>
          <div className="mt-4 divide-y divide-border">
            {latestSppBills.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{monthLabel(item.billing_year, item.billing_month)}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "paid" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                    {sppStatusLabels[item.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{money(item.paid_amount)} / {money(item.amount)}</p>
              </div>
            ))}
            {!sppBills.length ? <p className="py-4 text-sm text-muted">Belum ada tagihan SPP.</p> : null}
            {sppBills.length > 5 ? <p className="pt-3 text-xs font-semibold text-muted">Menampilkan 5 tagihan terbaru dari {sppBills.length} histori.</p> : null}
          </div>
        </article>

        <article className="card-soft rounded-lg bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-primary">Penilaian Terbaru</h2>
          <div className="mt-4 divide-y divide-border">
            {latestEvaluationScores.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{item.aspect?.name || "-"}</p>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">{indicatorLabels[item.indicator]}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{item.period?.name || "-"} - Nilai {item.score}</p>
              </div>
            ))}
            {!evaluationScores.length ? <p className="py-4 text-sm text-muted">Belum ada nilai penilaian.</p> : null}
            {evaluationScores.length > 5 ? <p className="pt-3 text-xs font-semibold text-muted">Menampilkan 5 nilai terbaru dari {evaluationScores.length} histori.</p> : null}
          </div>
        </article>

        <article className="card-soft rounded-lg bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-primary">Kenaikan Tingkat</h2>
          <div className="mt-4 divide-y divide-border">
            {latestRankPromotions.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{item.event?.name || "-"}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.result === "passed" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                    {item.result === "passed" ? "Lulus" : item.result}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{item.from_rank?.label || "-"} ke {item.to_rank?.label || "-"}</p>
              </div>
            ))}
            {!rankPromotions.length ? <p className="py-4 text-sm text-muted">Belum ada histori kenaikan tingkat.</p> : null}
            {rankPromotions.length > 5 ? <p className="pt-3 text-xs font-semibold text-muted">Menampilkan 5 histori terbaru dari {rankPromotions.length} data.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
