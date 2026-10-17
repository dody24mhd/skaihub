import type { Metadata } from "next";
import AdminDashboardOverview from "../_components/admin-dashboard-overview";
import AdminShell from "../_components/admin-shell";

export const metadata: Metadata = {
  title: "Admin CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <AdminShell
      title="Dashboard"
      description="Pusat kontrol internal untuk platform SKAIHUB dan konten website utama."
    >
      <AdminDashboardOverview />
    </AdminShell>
  );
}
