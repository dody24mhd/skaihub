"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentDetailResponse, getAkademiMe, getAkademiStudentDetail } from "../_lib/admin-api";
import StudentAchievementsSection from "./students/student-achievements-section";
import StudentProfileCard from "./students/student-profile-card";
import StudentRankHistorySection from "./students/student-rank-history-section";
import StudentReportLink from "./students/student-report-link";
import StudentRecentHistory from "./students/student-recent-history";

const TOKEN_KEY = "skaihub_admin_token";

const linkClass = "inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold";

export default function AcademyStudentDetailManager({ studentId }: { studentId: number }) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<StudentDetailResponse | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(activeToken);

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      Promise.all([getAkademiStudentDetail(activeToken, studentId), getAkademiMe(activeToken)])
        .then(([detailData, profileData]) => {
          setData(detailData);
          setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
        })
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat detail siswa."))
        .finally(() => setIsLoading(false));
    });
  }, [studentId]);

  if (isLoading) return <p className="text-sm text-muted">Memuat detail siswa...</p>;

  if (!data) {
    return (
      <div className="space-y-4">
        <Link className={`${linkClass} w-fit border border-border bg-white px-3 text-primary`} href="/academy/students">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>
        <p className="border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link className={`${linkClass} w-fit border border-border bg-white px-3 text-primary`} href="/academy/students">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Daftar Siswa
        </Link>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {canManage ? (
            <Link className={`${linkClass} col-span-2 border border-border bg-white text-primary sm:col-span-1`} href={`/academy/students/${data.student.id}/edit`}>
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Siswa
            </Link>
          ) : null}
          <Link className={`${linkClass} bg-primary text-white`} href="/academy/evaluations">
            <span className="material-symbols-outlined text-[18px]">grading</span>
            Input Penilaian
          </Link>
          <Link className={`${linkClass} border border-border bg-white text-primary`} href="/academy/rank-promotions">
            <span className="material-symbols-outlined text-[18px]">military_tech</span>
            Kenaikan Tingkat
          </Link>
        </div>
      </div>

      <StudentProfileCard student={data.student} summary={data.summary} />

      <StudentReportLink token={token} studentId={data.student.id} />

      <section className="grid gap-4 lg:grid-cols-2">
        <StudentAchievementsSection token={token} studentId={data.student.id} canManage={canManage} />
        <StudentRankHistorySection token={token} studentId={data.student.id} />
      </section>

      <StudentRecentHistory data={data} />
    </div>
  );
}
