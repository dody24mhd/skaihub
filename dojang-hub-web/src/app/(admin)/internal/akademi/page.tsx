import type { Metadata } from "next";
import AdminShell from "../../_components/admin-shell";
import AdminAkademiManager from "../../_components/admin-akademi-manager";

export const metadata: Metadata = {
  title: "Akademi",
  robots: { index: false, follow: false },
};

export default function AdminAkademiPage() {
  return (
    <AdminShell
      title="Akademi"
      eyebrow="Platform"
      description="Kelola akademi, paket, status aktif, subdomain, dan admin pertama untuk setiap tenant."
    >
      <AdminAkademiManager />
    </AdminShell>
  );
}
