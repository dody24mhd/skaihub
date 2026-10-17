import type { Metadata } from "next";
import AdminTestimoniManager from "../../_components/admin-testimoni-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "CMS Testimoni | SKAIHUB Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminTestimoniPage() {
  return (
    <AdminShell
      title="Testimoni"
      description="Kelola ulasan dan testimoni dari akademi untuk ditampilkan di halaman utama."
    >
      <AdminTestimoniManager />
    </AdminShell>
  );
}
