import Link from "next/link";
import AdminShell from "./admin-shell";
import Icon from "./ui/icon";

type AdminComingSoonProps = {
  title: string;
  icon: string;
  group: "Platform" | "CMS";
  description: string;
  checklist: string[];
};

export default function AdminComingSoon({
  title,
  icon,
  group,
  description,
  checklist,
}: AdminComingSoonProps) {
  return (
    <AdminShell title={title} eyebrow={group} description={description}>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card-soft rounded-lg bg-white p-6">
          <div className="mb-6 flex size-14 items-center justify-center rounded-md bg-primary text-white">
            <Icon name={icon} className="text-[32px]" />
          </div>
          <p className="label-caps mb-2 text-secondary">Segera</p>
          <h2 className="text-2xl font-bold text-primary">
            Modul {title} sedang disiapkan
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Halaman ini sudah ditempatkan di struktur admin supaya navigasi,
            permission, dan konsep dashboard tetap utuh saat modulnya mulai
            dikerjakan.
          </p>
          <Link
            href="/internal"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" className="text-[20px]" />
            Dashboard
          </Link>
        </div>

        <aside className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps mb-3 text-secondary">Ruang lingkup</p>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-md bg-surface px-3 py-3">
                <Icon name="check_circle" className="text-[20px] text-success-strong" />
                <p className="text-sm font-medium leading-6 text-primary">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
