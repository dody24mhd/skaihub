import { Metadata } from "next";
import AdminShell from "../../_components/admin-shell";
import AdminCmsDashboard from "../../_components/admin-cms-dashboard";

export const metadata: Metadata = {
  title: "Dashboard CMS - SKAIHUB Admin",
};

export default function CmsDashboardPage() {
  return (
    <AdminShell
      title="Dashboard CMS"
      description="Ringkasan aktivitas dan performa website publik SKAIHUB."
    >
      <AdminCmsDashboard />
    </AdminShell>
  );
}
