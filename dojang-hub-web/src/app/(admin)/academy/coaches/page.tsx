import type { Metadata } from "next";
import AcademyCoachesManager from "../../_components/academy-coaches-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Pelatih Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyCoachesPage() {
  return (
    <AcademyShell hasPageHeader title="Pelatih" description="Lengkapi profil pelatih dari akun pelatih yang dibuat melalui Akun Akademi.">
      <AcademyCoachesManager />
    </AcademyShell>
  );
}
