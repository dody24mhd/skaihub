import type { Metadata } from "next";
import AdminFaqManager from "../../_components/admin-faq-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "CMS FAQ | SKAIHUB Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminFaqPage() {
  return (
    <AdminShell
      title="FAQ"
      description="Kelola daftar pertanyaan yang sering diajukan beserta jawabannya untuk membantu pengunjung website."
    >
      <AdminFaqManager />
    </AdminShell>
  );
}
