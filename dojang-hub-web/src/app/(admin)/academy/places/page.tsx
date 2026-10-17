import type { Metadata } from "next";
import AcademyPlacesManager from "../../_components/academy-places-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Tempat Latihan",
  robots: { index: false, follow: false },
};

export default function AcademyPlacesPage() {
  return (
    <AcademyShell hasPageHeader title="Tempat Latihan" description="Kelola lokasi latihan yang dipakai oleh kelas atau unit akademi.">
      <AcademyPlacesManager />
    </AcademyShell>
  );
}
