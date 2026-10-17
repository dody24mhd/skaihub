"use client";

import Link from "next/link";
import { useState } from "react";
import { createWhatsAppUrl } from "../_lib/whatsapp";

const navItems = [
  { label: "Fitur", href: "/fitur" },
  { label: "Harga", href: "/harga" },
  { label: "Event", href: "/event" },
  { label: "Berita", href: "/berita" },
  { label: "Tentang", href: "/tentang" },
  { label: "Hubungi", href: "/hubungi" },
];

const registerUrl = createWhatsAppUrl(
  "Halo SKAIHUB, saya ingin mendaftarkan akademi bela diri."
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-bright/95 backdrop-blur">
      <div className="container-app flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <span
            className="material-symbols-outlined text-3xl text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sports_martial_arts
          </span>
          <span className="font-heading text-xl font-bold text-primary">
            SKAIHUB
          </span>
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold tracking-[0.05em] text-muted transition-colors hover:text-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={registerUrl}
          className="hidden rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_4px_10px_rgba(3,22,54,0.16)] transition hover:bg-primary-container sm:inline-flex"
        >
          Daftarkan Akademi
        </Link>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-primary md:hidden"
        >
          <span className="sr-only">Buka menu navigasi</span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
          >
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-border bg-white md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <nav className="container-app flex flex-col py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="border-b border-border py-4 text-sm font-bold uppercase tracking-[0.05em] text-primary last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={registerUrl}
            onClick={() => setIsOpen(false)}
            className="mt-4 inline-flex justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Daftarkan Akademi
          </Link>
        </nav>
      </div>
    </header>
  );
}
