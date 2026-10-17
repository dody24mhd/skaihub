import type { Metadata } from "next";
import AcademyEvaluationsManager from "../../_components/academy-evaluations-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Penilaian Siswa Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyEvaluationsPage() {
  return (
    <AcademyShell
      title="Penilaian Siswa"
      description="Input nilai 1-100 dan lihat rekap penilaian siswa berdasarkan format penilaian yang sudah disiapkan."
    >
      <AcademyEvaluationsManager />
    </AcademyShell>
  );
}
