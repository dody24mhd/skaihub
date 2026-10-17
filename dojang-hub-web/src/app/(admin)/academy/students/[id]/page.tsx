import type { Metadata } from "next";
import AcademyShell from "../../../_components/academy-shell";
import AcademyStudentDetailManager from "../../../_components/academy-student-detail-manager";

export const metadata: Metadata = {
  title: "Detail Siswa Akademi",
  robots: { index: false, follow: false },
};

export default async function AcademyStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AcademyShell
      title="Detail Siswa"
      description="Lihat profil, absensi, SPP, dan histori penilaian siswa dalam satu tempat."
    >
      <AcademyStudentDetailManager studentId={Number(id)} />
    </AcademyShell>
  );
}
