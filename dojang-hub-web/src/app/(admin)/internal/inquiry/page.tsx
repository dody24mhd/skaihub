import type { Metadata } from "next";
import AdminInquiryManager from "../../_components/admin-inquiry-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "Pesan Masuk",
  robots: { index: false, follow: false },
};

export default function AdminInquiryPage() {
  return (
    <AdminShell
      title="Pesan Masuk"
      description="Tindak lanjuti pesan dari calon pengguna di halaman Hubungi."
    >
      <AdminInquiryManager />
    </AdminShell>
  );
}
