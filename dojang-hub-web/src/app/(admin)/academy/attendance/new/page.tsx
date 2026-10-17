import type { Metadata } from "next";
import AcademyAttendanceManager from "../../../_components/academy-attendance-manager";
import AcademyShell from "../../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Buka Absensi Latihan",
  robots: { index: false, follow: false },
};

export default async function AcademyAttendanceNewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; session?: string }>;
}) {
  const params = await searchParams;

  return (
    <AcademyShell
      title="Buka Absensi"
      description="Isi berita acara latihan, dokumentasi, dan daftar hadir siswa."
    >
      <AcademyAttendanceManager initialDate={params.date} initialSessionId={params.session ? Number(params.session) : undefined} />
    </AcademyShell>
  );
}
