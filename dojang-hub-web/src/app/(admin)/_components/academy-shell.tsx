"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AdminUser, AkademiPlan, getAkademiMe } from "../_lib/admin-api";
import {
  buildNavSections,
  filterNavSectionsByRole,
} from "./ui/academy-nav";
import BottomNav from "./ui/bottom-nav";

const TOKEN_KEY = "skaihub_admin_token";
const EMAIL_KEY = "skaihub_admin_email";
const NAME_KEY = "skaihub_admin_name";
const ROLE_KEY = "skaihub_admin_role";

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
  const [academyName, setAcademyName] = useState<string>("Akademi");

  const visibleNavSections = useMemo(() => {
    const rawSections = buildNavSections(plan);
    return filterNavSectionsByRole(rawSections, role);
  }, [role, plan]);

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
          if (me.akademi?.name) {
            setAcademyName(me.akademi.name);
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
      {/* Sidebar untuk Layar Besar (lg+) */}
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
          {/* Header ringkas di bawah lg (tinggi <= 56px / h-14) */}
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-muted">
                {academyName}
              </p>
              <h1 className="truncate font-heading text-sm font-bold text-primary">
                {title}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-white text-primary transition hover:bg-secondary/10 hover:text-secondary"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

          {/* Header desktop lg+ */}
          <div className="hidden lg:flex min-h-16 items-center justify-between gap-4 px-8">
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
        </header>

        {/* Konten halaman dengan pb-24 di bawah md untuk memberi ruang BottomNav */}
        <div className="px-5 py-6 pb-24 md:pb-8 lg:px-8 lg:py-8">
          {description ? <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
          {children}
        </div>
      </section>

      {/* Navigasi Bawah di Mobile (< md) */}
      <BottomNav role={role} plan={plan} onLogout={handleLogout} />
    </main>
  );
}
