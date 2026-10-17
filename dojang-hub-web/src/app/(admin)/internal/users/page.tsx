import type { Metadata } from "next";
import AdminComingSoon from "../../_components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Akademi",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminComingSoon
      title="Admin Akademi"
      icon="manage_accounts"
      group="Platform"
      description="Kelola owner, admin, dan akses tiap akademi."
      checklist={[
        "Owner utama setiap akademi",
        "Admin tambahan dan role akses",
        "Reset akses dan status akun",
        "Audit perubahan penting",
      ]}
    />
  );
}
