import type { Metadata } from "next";
import AcademyFinanceManager from "../../_components/academy-finance-manager";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Keuangan Akademi",
  robots: { index: false, follow: false },
};

export default function AcademyFinancePage() {
  return (
    <AcademyShell
      title="Keuangan"
      description="Laporan nominal SPP dan rekap pembayaran khusus Ketua Akademi."
    >
      <AcademyFinanceManager />
    </AcademyShell>
  );
}
