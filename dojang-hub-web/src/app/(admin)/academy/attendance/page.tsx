import type { Metadata } from "next";
import AcademyAttendanceOverviewManager from "../../_components/academy-attendance-overview-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Absensi Latihan",
  robots: { index: false, follow: false },
};

export default function AcademyAttendancePage() {
  return (
    <AcademyShell
      title="Absensi Latihan"
      description="Pantau kalender dan riwayat absensi aktual dari berita acara latihan."
    >
      <AcademyAttendanceOverviewManager />
    </AcademyShell>
  );
}
