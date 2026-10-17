import type { Metadata } from "next";
import AcademyShell from "../../../_components/academy-shell";
import AcademyStudentFormManager from "../../../_components/academy-student-form-manager";

export const metadata: Metadata = {
  title: "Tambah Siswa Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyStudentNewPage() {
  return (
    <AcademyShell
      title="Tambah Siswa"
      description="Lengkapi data utama siswa, kelas, tingkatan, kontak wali, dan catatan pendukung."
    >
      <AcademyStudentFormManager />
    </AcademyShell>
  );
}
