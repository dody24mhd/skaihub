import Link from "next/link";
import Navbar from "./_components/navbar";
import { createWhatsAppUrl, formatWhatsAppDisplay, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./_lib/whatsapp";
import { getSiteSettings } from "./_lib/compro-data";

export default async function ComproLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const waNumber = settings.whatsapp_number ?? WHATSAPP_NUMBER;
  const waDisplay = settings.whatsapp_number
    ? formatWhatsAppDisplay(settings.whatsapp_number)
    : WHATSAPP_DISPLAY;
  const siteEmail = settings.site_email ?? "hello@skaihub.com";

  const footerWhatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin bertanya tentang layanan SKAIHUB.",
    waNumber,
  );
  return (
    <div className="min-h-screen bg-background">
      <Navbar waNumber={waNumber} />
      <main>{children}</main>
      <footer className="border-t border-slate-800 bg-primary py-14 text-surface-variant">
        <div className="container-app grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-5 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-3xl text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sports_martial_arts
              </span>
              <span className="font-heading text-xl font-bold text-white">
                SKAIHUB
              </span>
            </Link>
            <p className="text-sm leading-6 text-surface-variant/80">
              Platform manajemen akademi Taekwondo dan Karate untuk operasional yang lebih rapi dan profesional.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.05em] text-white">
              Platform
            </h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/fitur" className="hover:text-white">Fitur</Link>
              <Link href="/harga" className="hover:text-white">Harga</Link>
              <Link href="/event" className="hover:text-white">Event</Link>
              <Link href="/berita" className="hover:text-white">Berita</Link>
              <Link href="/tentang" className="hover:text-white">Tentang</Link>
              <Link href="/hubungi" className="hover:text-white">Hubungi</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.05em] text-white">
              Legal
            </h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/terms" className="hover:text-white">
                Syarat &amp; Ketentuan
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Kebijakan Privasi
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.05em] text-white">
              Kontak
            </h4>
            <div className="flex flex-col gap-3 text-sm">
              <a href={footerWhatsappUrl} className="hover:text-white">
                WhatsApp: {waDisplay}
              </a>
              <a href={`mailto:${siteEmail}`} className="hover:text-white">
                {siteEmail}
              </a>
            </div>
          </div>
        </div>

        <div className="container-app mt-10 border-t border-white/10 pt-6 text-xs text-surface-variant/70">
          Copyright 2026 SKAIHUB. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
