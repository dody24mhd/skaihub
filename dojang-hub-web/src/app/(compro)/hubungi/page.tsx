import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "../_components/contact-form";
import { getHomeFaqs, getSiteSettings } from "../_lib/compro-data";
import { createWhatsAppUrl, formatWhatsAppDisplay, OFFICE_HOURS, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "../_lib/whatsapp";

export const metadata: Metadata = {
  title: "Hubungi SKAIHUB",
  description:
    "Hubungi SKAIHUB untuk konsultasi paket, demo platform, dan setup awal aplikasi manajemen akademi bela diri (Taekwondo & Karate).",
  alternates: {
    canonical: "/hubungi",
  },
  openGraph: {
    title: "Hubungi SKAIHUB | Konsultasi Digitalisasi Akademi Bela Diri",
    description:
      "Konsultasikan kebutuhan akademi Anda dan mulai rapikan operasional dengan SKAIHUB.",
    url: "/hubungi",
  },
};

export default async function HubungiPage() {
  const [faqs, settings] = await Promise.all([getHomeFaqs(), getSiteSettings()]);

  const waNumber = settings.whatsapp_number ?? WHATSAPP_NUMBER;
  const waDisplay = settings.whatsapp_number
    ? formatWhatsAppDisplay(settings.whatsapp_number)
    : WHATSAPP_DISPLAY;
  const siteEmail = settings.site_email ?? "hello@skaihub.com";

  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin konsultasi tentang digitalisasi akademi bela diri.",
    waNumber,
  );

  const contacts = [
    {
      icon: "chat",
      title: "WhatsApp",
      desc: "Cara tercepat untuk menghubungi kami",
      value: waDisplay,
      action: whatsappUrl,
      label: "Chat Sekarang",
      highlighted: true,
    },
    {
      icon: "mail",
      title: "Email",
      desc: "Untuk pertanyaan formal atau detail",
      value: siteEmail,
      action: `mailto:${siteEmail}`,
      label: "Kirim Email",
      highlighted: false,
    },
    {
      icon: "schedule",
      title: "Jam Operasional",
      desc: "Kami siap membantu di jam kerja",
      value: OFFICE_HOURS,
      action: null,
      label: null,
      highlighted: false,
    },
  ];

  return (
    <div className="bg-white">

      {/* -- HERO -- */}
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute right-0 top-0 h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="absolute right-0 top-0 h-full w-1/5 bg-secondary/20 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="container-app relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Kontak</span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Ada yang Bisa<br />
            <span className="text-secondary">Kami Bantu?</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Dari konsultasi paket sampai menyiapkan akun, tim SKAIHUB siap membantu akademi Anda lewat WhatsApp.
          </p>
        </div>
      </section>

      {/* -- KONTAK CARDS -- */}
      <section className="section-y bg-white">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Hubungi Kami</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Pilih Cara<br />Terbaik untuk Anda
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Pertanyaan dijawab pada jam layanan, paling cepat lewat WhatsApp.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {contacts.map((c) => (
              <div
                key={c.title}
                className={`group relative flex flex-col gap-6 overflow-hidden p-8 transition-all duration-300 ${
                  c.highlighted
                    ? "bg-primary text-white shadow-[8px_8px_0px_theme(colors.secondary)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_theme(colors.secondary)]"
                    : "border-2 border-border bg-white hover:-translate-y-1 hover:border-primary/30 hover:shadow-[6px_6px_0px_theme(colors.primary)]"
                }`}
              >
                {c.highlighted && (
                  <>
                    <div className="absolute right-0 top-0 h-20 w-20 bg-secondary/20 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                    <div className="absolute right-0 top-0 h-12 w-12 bg-secondary/30 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                  </>
                )}

                <div className={`flex h-12 w-12 items-center justify-center transition-colors duration-300 ${
                  c.highlighted ? "bg-secondary" : "bg-primary/5 group-hover:bg-primary/10"
                }`}>
                  <span
                    className={`material-symbols-outlined ${c.highlighted ? "text-white" : "text-primary"}`}
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}
                  >
                    {c.icon}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className={`font-heading text-lg font-black uppercase ${c.highlighted ? "text-white" : "text-primary"}`}>
                    {c.title}
                  </h3>
                  <p className={`mt-1 text-sm ${c.highlighted ? "text-white/50" : "text-muted"}`}>{c.desc}</p>
                  <p className={`mt-3 text-base font-bold ${c.highlighted ? "text-white" : "text-primary"}`}>{c.value}</p>
                </div>

                {c.action && c.label && (
                  <Link
                    href={c.action}
                    className={`block py-3 text-center text-xs font-black uppercase tracking-widest transition-all sm:text-sm ${
                      c.highlighted
                        ? "bg-secondary text-white hover:bg-secondary-dark"
                        : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {c.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FORM INQUIRY -- */}
      <section className="section-y bg-slate-50">
        <div className="container-app">
          <div className="grid gap-16 lg:grid-cols-2">

            {/* Kiri: info */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Form Minat</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Tinggalkan<br />Pesan untuk Kami
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Isi form ini dan tim SKAIHUB akan menghubungi Anda lewat WhatsApp pada jam layanan.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: "check_circle", text: "Konsultasi gratis tanpa komitmen" },
                  { icon: "check_circle", text: "Dibalas pada jam layanan" },
                  { icon: "check_circle", text: "Tim bantu menyiapkan akun dari awal" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanan: form */}
            <div className="bg-white p-8 shadow-[8px_8px_0px_theme(colors.primary)]">
              <ContactForm waNumber={waNumber} />
            </div>
          </div>
        </div>
      </section>

      {/* -- FAQ SINGKAT -- */}
      <section className="section-y bg-white">
        <div className="container-app max-w-3xl">
          <div className="mb-12 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">FAQ</span>
              <div className="h-1 w-10 bg-secondary" />
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary">
              Pertanyaan<br />Umum
            </h2>
          </div>
          <div className="space-y-2">
            {faqs.length > 0 ? (
              faqs.map((faq, i) => (
                <details key={faq.q} className="group border-2 border-border bg-white open:border-primary">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                    <span className="flex items-center gap-4">
                      <span className="font-heading text-xs font-black text-secondary">0{i + 1}</span>
                      <span className="font-heading text-base font-bold uppercase text-primary">{faq.q}</span>
                    </span>
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center border-2 border-primary text-primary transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted italic">
                Belum ada pertanyaan yang diajukan saat ini.
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
