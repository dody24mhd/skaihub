"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminUser, AkademiPlan } from "../../_lib/admin-api";
import {
  bottomNavItems,
  buildNavSections,
  filterNavSectionsByRole,
} from "./academy-nav";
import SheetModal from "./sheet-modal";
import Icon from "./icon";

export type BottomNavProps = {
  role: AdminUser["role"] | string | null;
  plan: AkademiPlan | null;
  onLogout: () => void;
  className?: string;
};

export default function BottomNav({
  role,
  plan,
  onLogout,
  className = "",
}: BottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const items = useMemo(() => bottomNavItems(role), [role]);

  const remainingSections = useMemo(() => {
    const rawSections = buildNavSections(plan);
    const visibleSections = filterNavSectionsByRole(rawSections, role);
    const bottomHrefs = new Set(
      items.filter((i) => !i.isMore).map((i) => i.href)
    );

    return visibleSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !bottomHrefs.has(item.href)),
      }))
      .filter((section) => section.items.length > 0);
  }, [plan, role, items]);

  return (
    <>
      <nav
        aria-label="Navigasi Bawah"
        className={`fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white text-primary pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden ${className}`}
      >
        <div className="grid grid-cols-5 items-stretch">
          {items.map((item) => {
            if (item.isMore) {
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setIsMoreOpen(true)}
                  className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-1 text-center text-muted transition hover:text-primary active:bg-surface-container-low focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-label="Lainnya"
                >
                  <Icon name={item.icon} className="text-[22px]" />
                  <span className="text-[10px] font-bold leading-tight">
                    {item.title}
                  </span>
                </button>
              );
            }

            const isActive =
              item.href === "/academy"
                ? pathname === "/academy"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.title}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-1 text-center transition active:bg-surface-container-low focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                  isActive
                    ? "text-secondary font-bold"
                    : "text-muted hover:text-primary"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={isActive ? "text-[22px] [font-variation-settings:'FILL'_1]" : "text-[22px]"}
                />
                <span className="text-[10px] font-bold leading-tight">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sheet Modal untuk Menu Lainnya */}
      <SheetModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="Menu Lainnya"
      >
        <div className="space-y-6">
          {remainingSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-1 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted/80">
                {section.title}
              </p>
              <div className="divide-y divide-border/60">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/academy"
                      ? pathname === "/academy"
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex min-h-11 items-center gap-3 px-2 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-surface-container-low text-secondary font-bold"
                          : "text-primary hover:bg-surface-container-low"
                      }`}
                    >
                      <Icon name={item.icon} className="text-[20px]" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onLogout();
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 border-2 border-secondary bg-secondary/5 text-sm font-bold uppercase tracking-wider text-secondary transition hover:bg-secondary hover:text-white"
            >
              <Icon name="logout" className="text-[20px]" />
              Keluar
            </button>
          </div>
        </div>
      </SheetModal>
    </>
  );
}
