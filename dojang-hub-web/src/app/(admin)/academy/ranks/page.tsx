import type { Metadata } from "next";
import AcademyRanksManager from "../../_components/academy-ranks-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Sabuk / Tingkatan Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyRanksPage() {
  return (
    <AcademyShell
      title="Sabuk / Tingkatan"
      description="Kelola master sabuk atau level yang dipakai pada data siswa dan proses kenaikan tingkat."
    >
      <AcademyRanksManager />
    </AcademyShell>
  );
}
