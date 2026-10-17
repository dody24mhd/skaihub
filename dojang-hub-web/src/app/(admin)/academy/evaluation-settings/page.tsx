import type { Metadata } from "next";
import AcademyEvaluationsManager from "../../_components/academy-evaluations-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Format Penilaian Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyEvaluationSettingsPage() {
  return (
    <AcademyShell
      title="Format Penilaian"
      description="Kelola periode dan variabel penilaian sebelum pelatih mengisi nilai siswa."
    >
      <AcademyEvaluationsManager mode="settings" />
    </AcademyShell>
  );
}
