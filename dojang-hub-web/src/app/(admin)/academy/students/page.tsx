import type { Metadata } from "next";
import AcademyStudentsManager from "../../_components/academy-students-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Siswa Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyStudentsPage() {
  return (
    <AcademyShell title="Siswa" description="Kelola data siswa aktif, profil wali, kelas utama, dan tingkatan.">
      <AcademyStudentsManager />
    </AcademyShell>
  );
}
