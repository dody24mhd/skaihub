import type { Metadata } from "next";
import AdminSettingsManager from "../../_components/admin-settings-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "Pengaturan Website | SKAIHUB Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="Pengaturan Website"
      description="Kelola konfigurasi global website: nomor WhatsApp CTA, statistik hero, dan pengaturan lainnya."
    >
      <AdminSettingsManager />
    </AdminShell>
  );
}
