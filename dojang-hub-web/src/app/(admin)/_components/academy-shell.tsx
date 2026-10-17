"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AdminUser, AkademiPlan, getAkademiMe } from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";
const EMAIL_KEY = "skaihub_admin_email";
const NAME_KEY = "skaihub_admin_name";
const ROLE_KEY = "skaihub_admin_role";

function buildNavSections(plan: AkademiPlan | null) {
  const hasPublicWebsite = plan === "pro" || plan === "scale";

  return [
    {
      title: "Ringkasan",
      items: [
        { title: "Dashboard", href: "/academy", icon: "dashboard", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
      ],
    },
    {
      title: "Setup Akademi",
      items: [
        { title: "Akun Akademi", href: "/academy/users", icon: "manage_accounts", roles: ["ketua_akademi", "admin_akademi"] },
        { title: "Pelatih", href: "/academy/coaches", icon: "sports_martial_arts", roles: ["ketua_akademi", "admin_akademi"] },
        { title: "Tempat Latihan", href: "/academy/places", icon: "location_on", roles: ["ketua_akademi", "admin_akademi"] },
        { title: "Kelas", href: "/academy/classes", icon: "groups", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "Sabuk / Tingkatan", href: "/academy/ranks", icon: "military_tech", roles: ["ketua_akademi", "admin_akademi"] },
        { title: "Format Penilaian", href: "/academy/evaluation-settings", icon: "rule_settings", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        ...(hasPublicWebsite
          ? [{ title: "Halaman Publik", href: "/academy/public-profile", icon: "language", roles: ["ketua_akademi", "admin_akademi"] }]
          : []),
      ],
    },
    {
      title: "Operasional",
      items: [
        { title: "Siswa", href: "/academy/students", icon: "badge", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "Jadwal", href: "/academy/schedules", icon: "calendar_month", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "Absensi", href: "/academy/attendance", icon: "fact_check", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "Penilaian", href: "/academy/evaluations", icon: "grading", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "Kenaikan Tingkat", href: "/academy/rank-promotions", icon: "workspace_premium", roles: ["ketua_akademi", "admin_akademi", "pelatih"] },
        { title: "SPP", href: "/academy/spp", icon: "payments", roles: ["ketua_akademi", "admin_akademi"] },
        { title: "Keuangan", href: "/academy/finance", icon: "account_balance_wallet", roles: ["ketua_akademi"] },
      ],
    },
  ];
}

type AcademyShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AcademyShell({ title, description, children }: AcademyShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<AdminUser["role"] | "">("");
  const [plan, setPlan] = useState<AkademiPlan | null>(null);

  const visibleNavSections = useMemo(() => {
    const sections = buildNavSections(plan).map((section) => ({
      ...section,
      items: role ? section.items.filter((item) => item.roles.includes(role)) : section.items,
    }));

    return sections.filter((section) => section.items.length);
  }, [role, plan]);

  const visibleNavItems = useMemo(() => visibleNavSections.flatMap((section) => section.items), [visibleNavSections]);

  useEffect(() => {
    queueMicrotask(async () => {
      const storedRole = localStorage.getItem(ROLE_KEY) as AdminUser["role"] | null;
      if (storedRole && ["super_admin", "admin"].includes(storedRole)) {
        router.replace("/internal");
        return;
      }
      setRole(storedRole || "");

      const token = localStorage.getItem(TOKEN_KEY);
      if (token && storedRole && ["ketua_akademi", "admin_akademi"].includes(storedRole)) {
        try {
          const me = await getAkademiMe(token);
          if (me.akademi?.plan) {
            setPlan(me.akademi.plan as AkademiPlan);
          }
        } catch {
          // silently ignore — sidebar still works without plan info
        }
      }
    });
  }, [router]);

  function handleLogout() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "LOGOUT" });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-surface text-primary lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-primary text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <Link href="/academy" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-white text-primary">
              <span className="material-symbols-outlined text-[26px]">sports_martial_arts</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/65">SKAIHUB</p>
              <p className="font-heading text-lg font-bold text-white">Akademi</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 p-4">
          {visibleNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-white/45">{section.title}</p>
              {section.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                      isActive ? "bg-white text-primary" : "text-white/72 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/72 transition hover:bg-secondary hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="min-w-0">
              <p className="label-caps text-secondary">Operasional Akademi</p>
              <h1 className="truncate text-xl font-bold text-primary sm:text-2xl">{title}</h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-white text-primary transition hover:bg-secondary/10 hover:text-secondary"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-border px-5 py-3 lg:hidden">
            {visibleNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-surface-container-low px-3 text-sm font-semibold text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">
          {description ? <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
          {children}
        </div>
      </section>
    </main>
  );
}
