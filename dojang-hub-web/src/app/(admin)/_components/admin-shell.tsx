"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import SheetModal from "./ui/sheet-modal";

const TOKEN_KEY = "skaihub_admin_token";
const EMAIL_KEY = "skaihub_admin_email";
const NAME_KEY = "skaihub_admin_name";
const ROLE_KEY = "skaihub_admin_role";

const navSections = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        href: "/internal",
        icon: "dashboard",
      },
      {
        title: "Akademi",
        href: "/internal/akademi",
        icon: "domain",
      },
      {
        title: "Subscription",
        href: "/internal/subscription",
        icon: "payments",
      },
      {
        title: "Staf Platform",
        href: "/internal/users",
        icon: "manage_accounts",
        superAdminOnly: true,
      },
    ],
  },
  {
    title: "CMS",
    items: [
      {
        title: "Dashboard CMS",
        href: "/internal/cms-dashboard",
        icon: "query_stats",
      },
      {
        title: "Event",
        href: "/internal/event",
        icon: "event",
      },
      {
        title: "Berita",
        href: "/internal/berita",
        icon: "newspaper",
      },
      {
        title: "Pesan Masuk",
        href: "/internal/inquiry",
        icon: "inbox",
      },
      {
        title: "FAQ",
        href: "/internal/faq",
        icon: "quiz",
      },
      {
        title: "Testimoni",
        href: "/internal/testimoni",
        icon: "reviews",
      },
      {
        title: "Pengaturan",
        href: "/internal/settings",
        icon: "settings",
      },
    ],
  },
];

type AdminShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
};

export default function AdminShell({
  title,
  eyebrow = "Admin CMS",
  description,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [role, setRole] = useState("");

  const visibleNavSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !("superAdminOnly" in item) || role === "super_admin"),
  }));

  useEffect(() => {
    queueMicrotask(() => {
      const storedRole = localStorage.getItem(ROLE_KEY);
      if (storedRole && ["ketua_akademi", "admin_akademi", "pelatih"].includes(storedRole)) {
        router.replace("/academy");
        return;
      }
      setRole(storedRole || "");
    });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-surface text-primary lg:grid lg:grid-cols-[280px_1fr]">
      {/* Sidebar untuk Layar Besar (lg+) */}
      <aside className="hidden border-r border-border bg-primary text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <Link href="/internal" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-white text-primary">
              <span className="material-symbols-outlined text-[26px]">
                sports_martial_arts
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/65">SKAIHUB</p>
              <p className="font-heading text-lg font-bold text-white">
                Admin Control
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 p-4">
          {visibleNavSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-bold uppercase text-white/40">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/internal"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-white text-primary"
                          : "text-white/72 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <Link
            href="/internal/account"
            className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
              pathname === "/internal/account"
                ? "bg-white text-primary"
                : "text-white/72 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            Ganti Password
          </Link>
          <Link
            href="https://skaihub.com"
            className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Lihat Web
          </Link>
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
            <div className="flex items-center gap-3 min-w-0">
              {/* Tombol Hamburger di bawah lg */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-white text-primary transition hover:bg-surface-container-low lg:hidden"
                aria-label="Buka menu"
              >
                <span className="material-symbols-outlined text-[24px]">
                  menu
                </span>
              </button>

              <div className="min-w-0">
                <p className="label-caps text-secondary">{eyebrow}</p>
                <h1 className="truncate text-xl font-bold text-primary sm:text-2xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-white text-primary transition hover:bg-secondary/10 hover:text-secondary"
                aria-label="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">
                  logout
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">
          {description ? (
            <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </section>

      {/* Drawer menu kiri di bawah lg */}
      <SheetModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Menu Admin"
        side="left"
      >
        <div className="space-y-6">
          {visibleNavSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted/70">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/internal"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-primary hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2 border-t border-border pt-4">
            <Link
              href="/internal/account"
              onClick={() => setIsDrawerOpen(false)}
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-primary hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              Ganti Password
            </Link>
            <Link
              href="https://skaihub.com"
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-primary hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              Lihat Web
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                handleLogout();
              }}
              className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-secondary hover:bg-secondary/10"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      </SheetModal>
    </main>
  );
}
