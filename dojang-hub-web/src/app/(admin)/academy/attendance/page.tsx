import type { Metadata } from "next";
import AcademyShell from "../../_components/academy-shell";
import AttendanceTabs from "../../_components/attendance/attendance-tabs";

export const metadata: Metadata = {
  title: "Absensi Latihan",
  robots: { index: false, follow: false },
};

export default function AcademyAttendancePage() {
  return (
    <AcademyShell
      title="Absensi Latihan"
      description="Buka absensi kelas hari ini, lalu pantau kalender dan riwayat berita acara latihan."
    >
      <AttendanceTabs />
    </AcademyShell>
  );
}
