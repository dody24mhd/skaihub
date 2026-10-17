import type { Metadata } from "next";
import AcademyPublicProfileManager from "../../_components/academy-public-profile-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Halaman Publik Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyPublicProfilePage() {
  return (
    <AcademyShell
      title="Halaman Publik"
      description="Kelola konten yang ditampilkan di halaman publik akademi Anda. Aktifkan publish agar dapat diakses oleh calon siswa."
    >
      <AcademyPublicProfileManager />
    </AcademyShell>
  );
}
