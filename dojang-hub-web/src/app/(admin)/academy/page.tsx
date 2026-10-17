import type { Metadata } from "next";
import AcademyDashboardManager from "../_components/academy-dashboard-manager";
import AcademyShell from "../_components/academy-shell";

export const metadata: Metadata = {
  title: "Dashboard Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyPage() {
  return (
    <AcademyShell
      title="Dashboard Akademi"
      description="Kelola fondasi operasional akademi: tempat latihan, kelas, pelatih, dan data siswa."
    >
      <AcademyDashboardManager />
    </AcademyShell>
  );
}
