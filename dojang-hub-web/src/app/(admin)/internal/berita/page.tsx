import type { Metadata } from "next";
import AdminBeritaManager from "../../_components/admin-berita-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "CMS Berita | SKAIHUB Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBeritaPage() {
  return (
    <AdminShell
      title="Berita & Artikel"
      description="Kelola publikasi berita, pengumuman, dan artikel edukasi untuk ditampilkan di website publik."
    >
      <AdminBeritaManager />
    </AdminShell>
  );
}
