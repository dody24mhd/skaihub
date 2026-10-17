import type { Metadata } from "next";
import AcademyShell from "../../_components/academy-shell";
import AcademyUsersManager from "../../_components/academy-users-manager";

export const metadata: Metadata = {
  title: "Akun Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyUsersPage() {
  return (
    <AcademyShell
      hasPageHeader
      title="Akun Akademi"
      description="Kelola pengurus akademi dan pelatih sesuai batas akses masing-masing jenis akun."
    >
      <AcademyUsersManager />
    </AcademyShell>
  );
}
