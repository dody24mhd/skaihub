import Link from "next/link";
import type { Metadata } from "next";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { getHomeFaqs, getSiteSettings } from "../_lib/compro-data";
import { effectiveStudentLimit, formatPlanPrice, quotaNote } from "@/lib/plan-pricing";

export const metadata: Metadata = {
  title: "Harga Paket SKAIHUB",
  description:
    "Pilih paket SKAIHUB Starter, Pro, atau Scale untuk digitalisasi operasional, absensi, evaluasi, dan website akademi bela diri.",
  alternates: {
    canonical: "/harga",
  },
  openGraph: {
    title: "Harga Paket SKAIHUB | Platform Manajemen Akademi Bela Diri",
    description:
      "Paket Starter, Pro, dan Scale untuk kebutuhan digitalisasi akademi Taekwondo dan Karate dari operasional dasar sampai website publik.",
    url: "/harga",
  },
};

const prices = [
  {
    name: "Starter",
    tag: null,
    desc: "Untuk akademi yang baru mulai digital",
    price: formatPlanPrice("starter"),
    access: "app.skaihub.com",
    forWho: `Akademi kecil hingga ${effectiveStudentLimit("starter", 0)} siswa yang baru mulai digitalisasi`,
    features: [
      { text: `Kuota ${effectiveStudentLimit("starter", 0)} siswa aktif`, included: true },
      { text: "Data Siswa & Pelatih", included: true },
      { text: "Jadwal, Sesi & Absensi", included: true },
      { text: "Iuran Siswa / Rekap SPP", included: true },
      { text: "Evaluasi Siswa", included: true },
      { text: "Riwayat Tingkatan & Prestasi", included: true },
      { text: "Website Publik Akademi", included: false },
    ],
    highlighted: false,
    icon: "assignment",
  },
  {
    name: "Pro",
    tag: "Paling Populer",
    desc: "Tampil profesional dengan website akademi",
    price: formatPlanPrice("pro"),
    access: "namaakademi.skaihub.com",
    forWho: `Akademi menengah hingga ${effectiveStudentLimit("pro", 0)} siswa yang butuh manajemen dan promosi`,
    features: [
      { text: `Kuota ${effectiveStudentLimit("pro", 0)} siswa aktif`, included: true },
      { text: "Data Siswa & Pelatih", included: true },
      { text: "Jadwal, Sesi & Absensi", included: true },
      { text: "Iuran Siswa / Rekap SPP", included: true },
      { text: "Evaluasi Siswa", included: true },
      { text: "Riwayat Tingkatan & Prestasi", included: true },
      { text: "Website Publik Akademi", included: true },
    ],
    highlighted: true,
    icon: null,
  },
  {
    name: "Scale",
    tag: null,
    desc: "Untuk akademi besar dengan operasional lebih padat",
    price: formatPlanPrice("scale"),
    access: "namaakademi.skaihub.com",
    forWho: `Akademi sampai ${effectiveStudentLimit("scale", 0)} siswa aktif yang butuh kapasitas lebih besar`,
    features: [
      { text: `Kuota ${effectiveStudentLimit("scale", 0)} siswa aktif`, included: true },
      { text: "Data Siswa & Pelatih", included: true },
      { text: "Jadwal, Sesi & Absensi", included: true },
      { text: "Iuran Siswa / Rekap SPP", included: true },
      { text: "Evaluasi Siswa", included: true },
      { text: "Riwayat Tingkatan & Prestasi", included: true },
      { text: "Website Publik Akademi", included: true },
    ],
    highlighted: false,
    icon: "military_tech",
  },
];

const modules = [
  {
    name: "Data & Manajemen",
    icon: "group",
    desc: "Data siswa dan pelatih",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Jadwal & Latihan",
    icon: "event_available",
    desc: "Jadwal mingguan, sesi latihan, dan absensi",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Iuran Siswa / SPP",
    icon: "payments",
    desc: "Catatan iuran & rekap tunggakan",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Evaluasi Siswa",
    icon: "description",
    desc: "Penilaian per periode custom",
    starter: true, pro: true, scale: true,
  },
  {
    name: "Website Publik Akademi",
    icon: "language",
    desc: "Website publik untuk profil akademi",
    starter: false, pro: true, scale: true,
  },
];

export default async function HargaPage() {
  const [faqs, settings] = await Promise.all([getHomeFaqs(), getSiteSettings()]);
  const waNumber = settings.whatsapp_number;
  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin bertanya tentang paket dan harga SKAIHUB.",
    waNumber,
  );
  return (
    <div className="bg-white">

      {/* -- HERO -- */}
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute right-0 top-0 h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="absolute right-0 top-0 h-full w-1/5 bg-secondary/20 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="container-app relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Investasi</span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Harga Transparan,<br />
            <span className="text-secondary">Tanpa Biaya Tersembunyi</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Tiga paket yang dirancang sesuai tahap digitalisasi akademi Anda. Mulai dari yang paling dasar, upgrade kapan saja.
          </p>
        </div>
      </section>

      {/* -- PRICING CARDS -- */}
      <section className="section-y bg-white pt-28">
        <div className="container-app">
          <div className="grid gap-6 md:grid-cols-3 md:items-end">
            {prices.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-primary text-white shadow-[8px_8px_0px_theme(colors.secondary)] md:-translate-y-4"
                    : "border-2 border-border bg-white text-slate-800 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                }`}
              >
                {/* Diagonal accent Pro */}
                {plan.highlighted && (
                  <>
                    <div className="absolute right-0 top-0 h-24 w-24 bg-secondary/20 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                    <div className="absolute right-0 top-0 h-16 w-16 bg-secondary/30 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                  </>
                )}

                {/* Icon watermark */}
                {plan.icon && (
                  <span
                    className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 select-none text-primary opacity-[0.04]"
                    style={{ fontSize: "160px", fontVariationSettings: "'FILL' 1" }}
                  >
                    {plan.icon}
                  </span>
                )}

                {/* Badge */}
                {plan.tag && (
                  <div className="absolute -top-4 left-6">
                    <span className="inline-flex items-center gap-1.5 bg-secondary px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                      </svg>
                      {plan.tag}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-4 mt-2">
                  <h3 className={`font-heading text-xl font-black uppercase ${plan.highlighted ? "text-white" : "text-primary"}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlighted ? "text-white/50" : "text-muted"}`}>{plan.desc}</p>
                </div>

                {/* For who */}
                <div className={`mb-4 rounded-none border-l-2 pl-3 text-xs leading-relaxed ${
                  plan.highlighted ? "border-secondary text-white/50" : "border-primary/20 text-muted"
                }`}>
                  {plan.forWho}
                </div>

                {/* Harga */}
                <div className={`mb-6 border-b pb-6 ${plan.highlighted ? "border-white/10" : "border-border"}`}>
                  <div className="flex items-end gap-1">
                    <span className="font-heading text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className={`mb-1 text-sm font-medium ${plan.highlighted ? "text-white/50" : "text-muted"}`}>/bulan</span>
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold ${
                    plan.highlighted ? "bg-white/10 text-white/60" : "bg-slate-100 text-muted"
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>language</span>
                    {plan.access}
                  </div>
                </div>

                {/* Fitur */}
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3 text-sm">
                      {feature.included ? (
                        <span className={`material-symbols-outlined flex-shrink-0 ${plan.highlighted ? "text-secondary" : "text-primary"}`}
                          style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined flex-shrink-0 text-slate-300"
                          style={{ fontVariationSettings: "'FILL' 0", fontSize: "18px" }}>cancel</span>
                      )}
                      <span className={feature.included
                        ? plan.highlighted ? "text-white/80" : "text-slate-700"
                        : plan.highlighted ? "text-white/25" : "text-slate-300"
                      }>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={createWhatsAppUrl(
                    `Halo SKAIHUB, saya tertarik paket ${plan.name}. Bisa dibantu penjelasannya?`
                  )}
                  className={`mt-8 block py-3.5 text-center text-sm font-black uppercase tracking-widest transition-all ${
                    plan.highlighted
                      ? "bg-secondary text-white hover:bg-secondary-dark"
                      : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {plan.highlighted ? "Mulai Sekarang" : "Pilih Paket"}
                </Link>
              </article>
            ))}
          </div>
          <p data-testid="quota-note" className="mt-10 border-l-4 border-secondary bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            <span className="font-bold text-primary">Kuota siswa aktif: </span>
            {quotaNote()}
          </p>
        </div>
      </section>

      {/* -- TABEL PERBANDINGAN MODUL -- */}
      <section className="section-y bg-slate-50">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Perbandingan</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Apa yang Kamu<br />Dapatkan
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Perbandingan lengkap 6 modul di setiap paket.
            </p>
          </div>

          <div className="overflow-x-auto border-2 border-border bg-white">
            <div className="min-w-[820px]">
            {/* Header */}
            <div className="grid grid-cols-4 border-b-2 border-border bg-primary">
              <div className="p-4 text-xs font-black uppercase tracking-widest text-white/40">Modul</div>
              {["Starter", "Pro", "Scale"].map((name, i) => (
                <div key={name} className={`border-l border-white/10 p-4 text-center ${i === 1 ? "bg-secondary/20" : ""}`}>
                  <p className="font-heading text-sm font-black uppercase text-white">{name}</p>
                  <p className="mt-0.5 text-xs text-white/40">{["Rp 99k", "Rp 199k", "Rp 349k"][i]}/bln</p>
                </div>
              ))}
            </div>

            {/* Rows */}
            {modules.map((mod, i) => (
              <div key={mod.name} className={`grid grid-cols-4 border-b border-border last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-primary/5">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "16px" }}>
                      {mod.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{mod.name}</p>
                    <p className="text-xs text-muted">{mod.desc}</p>
                  </div>
                </div>
                {[mod.starter, mod.pro, mod.scale].map((included, j) => (
                  <div key={j} className={`flex items-center justify-center border-l border-border p-4 ${j === 1 ? "bg-secondary/5" : ""}`}>
                    {included ? (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}>
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-200" style={{ fontVariationSettings: "'FILL' 0", fontSize: "22px" }}>
                        cancel
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- FAQ -- */}
      <section className="section-y bg-white">
        <div className="container-app max-w-3xl">
          <div className="mb-12 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">FAQ</span>
              <div className="h-1 w-10 bg-secondary" />
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary">
              Pertanyaan Soal<br />Harga & Billing
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
                Belum ada pertanyaan yang tersedia saat ini.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="absolute right-0 top-0 h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="absolute right-0 top-0 h-full w-1/5 bg-secondary/20 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="relative z-10 container-app flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Mulai Sekarang</span>
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              Masih Ada<br />Pertanyaan?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/60">
              Tim SKAIHUB siap membantu, dari konsultasi paket hingga setup awal akademi Anda.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link
              href={whatsappUrl}
              className="inline-flex w-full items-center justify-center gap-3 bg-secondary px-6 py-5 text-center text-xs font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 hover:bg-secondary-dark sm:w-auto sm:px-10 sm:text-sm"
            >
              Chat via WhatsApp
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <p className="text-xs text-white/30">Senin - Jumat, 09:00 - 17:00 WIB</p>
          </div>
        </div>
      </section>

    </div>
  );
}
