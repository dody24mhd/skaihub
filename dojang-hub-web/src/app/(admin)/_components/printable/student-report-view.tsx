"use client";

import { useCallback } from "react";
import { StudentReport, getAkademiStudentReport } from "../../_lib/admin-api";
import PrintablePage, { usePrintableData } from "./printable-page";
import StudentReportDocument from "./student-report-document";

const MISSING_PERIOD_ERROR = "Pilih periode evaluasi dari halaman detail siswa untuk mencetak rapor.";

export default function StudentReportView({ studentId, periodId }: { studentId: number; periodId: number | null }) {
  const loadReport = useCallback(
    async (token: string): Promise<StudentReport> => (await getAkademiStudentReport(token, studentId, periodId ?? 0)).report,
    [studentId, periodId],
  );
  const { data, isLoading, error, reload } = usePrintableData(periodId ? loadReport : null, "Gagal memuat rapor.");

  return (
    <PrintablePage
      backHref={`/academy/students/${studentId}`}
      backLabel="Kembali ke detail siswa"
      orientation="portrait"
      widthClass="max-w-3xl"
      isReady={Boolean(data)}
      isLoading={isLoading}
      loadingText="Memuat rapor..."
      error={periodId ? error : MISSING_PERIOD_ERROR}
      onRetry={periodId ? () => void reload() : undefined}
    >
      {data ? <StudentReportDocument report={data} /> : null}
    </PrintablePage>
  );
}
