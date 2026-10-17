import type { Metadata } from "next";
import StudentReportView from "../../../../_components/printable/student-report-view";

export const metadata: Metadata = {
  title: "Rapor Siswa",
  robots: { index: false, follow: false },
};

function parsePeriodId(value: string | string[] | undefined): number | null {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default async function AcademyStudentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { period_id: periodId } = await searchParams;

  return <StudentReportView studentId={Number(id)} periodId={parsePeriodId(periodId)} />;
}
