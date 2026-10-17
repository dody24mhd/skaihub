import { ReactNode } from "react";
import { StudentReport } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { SCORE_BANDS, getScoreLabel, getScoreLabelStyle } from "../evaluation/evaluation-types";
import { decimalLabel, longDateLabel } from "./printable-format";

const ATTENDANCE_ITEMS = [
  { key: "present", label: "Hadir" },
  { key: "sick", label: "Sakit" },
  { key: "excused", label: "Izin" },
  { key: "absent", label: "Alpa" },
] as const;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-1 w-8 bg-secondary" />
      <h2 className="font-heading text-sm font-black uppercase tracking-wider text-primary">{children}</h2>
    </div>
  );
}

function IdentityRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-border py-2">
      <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-primary">{children}</dd>
    </div>
  );
}

function ScoresTable({ report }: { report: StudentReport }) {
  if (report.scores.length === 0) {
    return <p className="border border-dashed border-border p-4 text-sm text-muted">Belum ada nilai pada periode ini.</p>;
  }

  return (
    <table aria-label="Nilai per aspek" className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-primary text-left text-xs uppercase text-white">
          <th className="px-2 py-2 font-bold">Aspek</th>
          <th className="hidden px-2 py-2 font-bold sm:table-cell print:table-cell">Kategori</th>
          <th className="px-2 py-2 text-center font-bold">Nilai</th>
          <th className="px-2 py-2 font-bold">Predikat</th>
        </tr>
      </thead>
      <tbody>
        {report.scores.map((row) => (
          <tr key={row.aspect_id} className="border-b border-border">
            <td className="px-2 py-2 font-semibold text-primary">{row.aspect}</td>
            <td className="hidden px-2 py-2 text-muted sm:table-cell print:table-cell">{row.category || "-"}</td>
            <td className="px-2 py-2 text-center font-bold text-primary">{row.score ?? "-"}</td>
            <td className={`px-2 py-2 ${getScoreLabelStyle(row.score)}`}>{getScoreLabel(row.score)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-surface-container" data-testid="report-average">
          <th className="px-2 py-2 text-left text-xs font-black uppercase text-primary" scope="row">Rata-rata</th>
          <td className="hidden sm:table-cell print:table-cell" />
          <td className="px-2 py-2 text-center font-heading text-base font-black text-primary">
            {report.average === null ? "-" : decimalLabel(report.average)}
          </td>
          <td className={`px-2 py-2 ${getScoreLabelStyle(report.average)}`}>{getScoreLabel(report.average)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function CoachNotes({ report }: { report: StudentReport }) {
  const notes = report.scores.filter((row) => row.notes);

  if (notes.length === 0) return <p className="text-sm text-muted">Tidak ada catatan.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {notes.map((row) => (
        <li key={row.aspect_id} className="border-l-4 border-secondary pl-3">
          <span className="font-bold text-primary">{row.aspect}: </span>
          <span className="text-muted">{row.notes}</span>
        </li>
      ))}
    </ul>
  );
}

export default function StudentReportDocument({ report }: { report: StudentReport }) {
  const { student, period, attendance } = report;

  return (
    <article aria-label={`Rapor ${student.name}`} className="printable-doc space-y-6 border border-border bg-white p-5 sm:p-8">
      <header className="flex flex-col gap-3 border-b-4 border-primary pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-heading text-xl font-black uppercase text-primary">{report.akademi.name}</p>
          <p className="label-caps mt-1 text-secondary">Rapor Perkembangan Siswa</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-heading text-base font-black text-primary">{period.name}</p>
          <p className="text-xs text-muted">
            {longDateLabel(period.starts_at)} – {longDateLabel(period.ends_at)}
          </p>
        </div>
      </header>

      <section>
        <SectionTitle>Identitas</SectionTitle>
        <dl className="grid gap-x-6 sm:grid-cols-2">
          <IdentityRow label="Nama">{student.name}</IdentityRow>
          <IdentityRow label="No. Anggota">{student.member_number}</IdentityRow>
          <IdentityRow label="Kelas">{student.class_name || "-"}</IdentityRow>
          <IdentityRow label="Tempat Latihan">{student.training_place || "-"}</IdentityRow>
          <IdentityRow label="Tanggal Lahir">{longDateLabel(student.birth_date)}</IdentityRow>
          <IdentityRow label="Sabuk">
            <AcademyRankBeltBadge rank={student.rank} size="sm" />
          </IdentityRow>
        </dl>
      </section>

      <section>
        <SectionTitle>Kehadiran Periode Ini</SectionTitle>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ATTENDANCE_ITEMS.map((item) => (
            <div key={item.key} className="border border-border p-2 text-center">
              <p className="text-xs font-bold uppercase text-muted">{item.label}</p>
              <p className="font-heading text-xl font-black text-primary">{attendance[item.key]}</p>
            </div>
          ))}
          <div className="border border-primary bg-primary p-2 text-center text-white">
            <p className="text-xs font-bold uppercase text-white/80">Kehadiran</p>
            <p className="font-heading text-xl font-black">{decimalLabel(attendance.rate)}%</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Dari {attendance.total} sesi latihan tercatat (sesi dipindah/batal tidak dihitung).</p>
      </section>

      <section>
        <SectionTitle>Nilai Evaluasi</SectionTitle>
        <ScoresTable report={report} />
        <p className="mt-2 text-xs text-muted">
          Predikat: {SCORE_BANDS.map((band) => `${band.label} ${band.min}–${band.max}`).join(" · ")}
        </p>
      </section>

      <section>
        <SectionTitle>Catatan Pelatih</SectionTitle>
        <CoachNotes report={report} />
      </section>

      <footer className="grid grid-cols-2 gap-6 pt-4 text-center text-sm">
        <div>
          <p className="text-xs text-muted">Pelatih / Penilai</p>
          <div className="mt-14 border-t border-primary pt-1 font-bold text-primary">{report.assessors.join(", ") || "-"}</div>
        </div>
        <div>
          <p className="text-xs text-muted">Orang Tua / Wali</p>
          <div className="mt-14 border-t border-primary pt-1 font-bold text-primary">&nbsp;</div>
        </div>
        <p className="col-span-2 text-left text-xs text-muted">Dicetak {longDateLabel(report.generated_at)}</p>
      </footer>
    </article>
  );
}
