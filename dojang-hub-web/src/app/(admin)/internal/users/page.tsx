import type { Metadata } from "next";
import AdminShell from "../../_components/admin-shell";
import PlatformUsersManager from "../../_components/platform-users/platform-users-manager";

export const metadata: Metadata = {
  title: "Staf Platform",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminShell hasPageHeader title="Staf Platform" eyebrow="Platform">
      <PlatformUsersManager />
    </AdminShell>
  );
}
