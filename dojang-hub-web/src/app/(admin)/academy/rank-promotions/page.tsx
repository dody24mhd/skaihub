import type { Metadata } from "next";
import AcademyRankPromotionsManager from "../../_components/academy-rank-promotions-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Kenaikan Tingkat Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyRankPromotionsPage() {
  return (
    <AcademyShell
      title="Kenaikan Tingkat"
      description="Kelola event UKT, peserta, hasil kelulusan, dan update tingkatan siswa yang lulus."
    >
      <AcademyRankPromotionsManager />
    </AcademyShell>
  );
}
