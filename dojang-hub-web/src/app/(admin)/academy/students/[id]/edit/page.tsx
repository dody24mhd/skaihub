import type { Metadata } from "next";
import AcademyShell from "../../../../_components/academy-shell";
import AcademyStudentFormManager from "../../../../_components/academy-student-form-manager";

export const metadata: Metadata = {
  title: "Edit Siswa Akademi",
  robots: { index: false, follow: false },
};

export default async function AcademyStudentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AcademyShell
      title="Edit Siswa"
      description="Perbarui profil siswa, kelas utama, tingkatan, kontak, dan catatan administrasi."
    >
      <AcademyStudentFormManager studentId={Number(id)} />
    </AcademyShell>
  );
}
