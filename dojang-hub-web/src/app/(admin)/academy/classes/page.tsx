import type { Metadata } from "next";
import AcademyClassesManager from "../../_components/academy-classes-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Kelas Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyClassesPage() {
  return (
    <AcademyShell hasPageHeader title="Kelas / Unit" description="Kelola kelompok latihan utama siswa dan nominal SPP khusus jika ada.">
      <AcademyClassesManager />
    </AcademyShell>
  );
}
