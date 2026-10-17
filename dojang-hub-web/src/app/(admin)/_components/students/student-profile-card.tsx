import { ReactNode } from "react";
import { Student, StudentDetailSummary } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { physicalSummary, shortDate } from "./format";
import { studentStatusLabels, studentStatusStyles } from "./student-status";
import Icon from "../ui/icon";

function ProfileItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-bold text-primary">{label}</dt>
      <dd className="mt-1 break-words text-muted">{children}</dd>
    </div>
  );
}

function StatCard({ label, value, caption, accent = "text-primary" }: { label: string; value: string | number; caption: string; accent?: string }) {
  return (
    <article className="card-soft bg-white p-4 sm:p-5">
      <p className="label-caps text-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-black sm:text-3xl ${accent}`}>{value}</p>
      <p className="text-sm text-muted">{caption}</p>
    </article>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  return (
    <a className="inline-flex min-h-11 items-center font-semibold text-primary underline" href={`tel:${phone}`}>
      {phone}
    </a>
  );
}

export default function StudentProfileCard({ student, summary }: { student: Student; summary: StudentDetailSummary }) {
  const attendancePercent = summary.attendance_total
    ? Math.round((summary.attendance_present / summary.attendance_total) * 100)
    : 0;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="card-soft min-w-0 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {student.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo_url} alt="" className="size-20 shrink-0 object-cover sm:size-24" />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center bg-primary/10 text-primary sm:size-24">
                <Icon name="person" className="text-[44px]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="label-caps text-secondary">Profil Siswa</p>
              <h2 className="mt-2 break-words font-heading text-xl font-black text-primary sm:text-2xl">{student.name}</h2>
              <p className="mt-1 text-sm font-semibold text-muted">{student.member_number}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted">{student.primary_class?.name || "Belum masuk kelas"}</span>
                <AcademyRankBeltBadge rank={student.current_rank} size="md" />
              </div>
            </div>
          </div>
          <span className={`w-fit px-3 py-1 text-xs font-bold ${studentStatusStyles[student.status]}`}>
            {studentStatusLabels[student.status]}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <ProfileItem label="Kelas utama">{student.primary_class?.name || "-"}</ProfileItem>
          <ProfileItem label="Tingkatan">
            <AcademyRankBeltBadge rank={student.current_rank} size="md" />
          </ProfileItem>
          <ProfileItem label="Bergabung">{shortDate(student.joined_date)}</ProfileItem>
          <ProfileItem label="Fisik">{physicalSummary(student)}</ProfileItem>
          <ProfileItem label="Kontak siswa">{student.student_phone ? <PhoneLink phone={student.student_phone} /> : "-"}</ProfileItem>
          <ProfileItem label="Wali">
            {student.guardian_name || "-"}
            {student.guardian_phone ? <span className="ml-1"><PhoneLink phone={student.guardian_phone} /></span> : null}
          </ProfileItem>
          <ProfileItem label="Sekolah">{student.school_name || "-"} {student.school_grade ? `(${student.school_grade})` : ""}</ProfileItem>
          <ProfileItem label="Ukuran baju">{student.shirt_size || "-"}</ProfileItem>
          <ProfileItem label="Catatan kesehatan">{student.health_notes || "-"}</ProfileItem>
        </dl>
      </article>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
        <StatCard label="Kehadiran" value={`${attendancePercent}%`} caption={`${summary.attendance_present} dari ${summary.attendance_total} sesi`} />
        <StatCard label="SPP Tertunggak" value={summary.spp_unpaid_count} caption="Tagihan belum lunas" accent="text-secondary" />
        <StatCard label="Rata-rata Nilai" value={summary.evaluation_average || "-"} caption="Dari histori penilaian" />
      </div>
    </section>
  );
}
