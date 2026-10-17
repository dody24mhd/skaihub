import type { Metadata } from "next";
import AdminEventsManager from "../../_components/admin-events-manager";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "CMS Event",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminEventPage() {
  return (
    <AdminShell
      title="Event"
      description="Kelola agenda taekwondo seperti kejuaraan, seminar, training camp, dan pengumuman kegiatan besar."
    >
      <AdminEventsManager />
    </AdminShell>
  );
}
