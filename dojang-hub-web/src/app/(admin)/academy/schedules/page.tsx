import type { Metadata } from "next";
import AcademySchedulesManager from "../../_components/academy-schedules-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Jadwal Latihan",
  robots: { index: false, follow: false },
};

export default function AcademySchedulesPage() {
  return (
    <AcademyShell
      title="Jadwal Latihan"
      description="Kelola pola jadwal reguler tiap kelas. Sesi aktual dan daftar hadir dicatat dari menu Absensi."
    >
      <AcademySchedulesManager />
    </AcademyShell>
  );
}
