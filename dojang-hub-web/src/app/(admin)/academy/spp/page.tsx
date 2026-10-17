import type { Metadata } from "next";
import AcademySppManager from "../../_components/academy-spp-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "SPP Akademi",
  robots: { index: false, follow: false },
};

export default function AcademySppPage() {
  return (
    <AcademyShell
      title="SPP / Iuran"
      description="Catat pembayaran cash, transfer, atau QRIS berdasarkan tagihan SPP siswa."
    >
      <AcademySppManager />
    </AcademyShell>
  );
}
