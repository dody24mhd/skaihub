import Link from "next/link";
import type { Metadata } from "next";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { getSiteSettings } from "../_lib/compro-data";

export const metadata: Metadata = {
  title: "Tentang SKAIHUB",
  description:
    "SKAIHUB membantu akademi Taekwondo dan Karate di Indonesia merapikan data siswa, absensi, SPP, evaluasi, dan profil digital akademi.",
  alternates: {
    canonical: "/tentang",
  },
  openGraph: {
    title: "Tentang SKAIHUB | Platform Manajemen Akademi Bela Diri",
    description:
      "Kenali SKAIHUB, platform untuk membantu akademi bela diri bekerja lebih rapi dan tampil profesional.",
    url: "/tentang",
  },
};

const values = [
  {
    icon: "touch_app",
    title: "Mudah",
    desc: "Dirancang untuk pengurus dan pelatih, bukan orang IT. Tampilan sederhana dan nyaman dipakai dari HP.",
  },
  {
    icon: "bolt",
    title: "Efektif",
    desc: "Setiap fitur dibuat untuk pekerjaan nyata di akademi. Tidak ada fitur yang dibuat hanya supaya terlihat canggih.",
  },
  {
    icon: "account_tree",
    title: "Sistematis",
    desc: "Alur kerja yang runtut, dari absensi harian, rapor, sampai kenaikan sabuk. Semuanya mengikuti urutan yang konsisten.",
  },
  {
    icon: "hub",
    title: "Terintegrasi",
    desc: "Semua modul terhubung. Data siswa yang diisi sekali langsung dipakai di absensi, rapor, SPP, dan riwayat sabuk.",
  },
];

export default async function TentangPage() {
  const settings = await getSiteSettings();
  const waNumber = settings.whatsapp_number;
  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin mengenal SKAIHUB dan konsultasi untuk akademi saya.",
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Tentang Kami</span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Tentang<br />
            <span className="text-secondary">SKAIHUB</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Platform manajemen akademi bela diri yang dibangun untuk kebutuhan pengurus dan pelatih Taekwondo dan Karate di Indonesia.
          </p>
        </div>
      </section>

      {/* -- CERITA / WHY -- */}
      <section className="section-y bg-white">
        <div className="container-app">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">

            {/* Kiri: label + heading */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Latar Belakang</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Kenapa<br />SKAIHUB<br />Dibuat?
              </h2>

            </div>

            {/* Kanan: narasi */}
            <div className="flex flex-col gap-6 text-base leading-relaxed text-muted">
              <p>
                Banyak akademi Taekwondo dan Karate di Indonesia dikelola dengan semangat besar, tetapi administrasinya masih tersebar di buku catatan, spreadsheet, dan grup WhatsApp.
              </p>
              <p>
                Akibatnya data siswa mudah tercecer, absensi sulit direkap, dan rapor masih ditulis tangan. Pengurus yang seharusnya fokus melatih justru banyak tersita untuk urusan administrasi.
              </p>
              <p>
                SKAIHUB dibuat untuk membantu hal itu. Kami percaya akademi besar maupun kecil layak punya sistem yang rapi, terjangkau, dan mudah dipakai. Bukan software umum yang dipaksakan, tetapi platform yang mengikuti alur kerja akademi bela diri.
              </p>
              <p className="font-semibold text-primary">
                Satu platform untuk operasional akademi, dari absensi harian sampai halaman profil publik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -- VISI & MISI -- */}
      <section className="relative bg-primary py-24 [clip-path:polygon(0_4%,100%_0,100%_96%,0_100%)]">
        <div className="container-app relative z-10">
          <div className="mb-14 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Arah Kami</span>
              <div className="h-1 w-10 bg-secondary" />
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              Visi & Misi
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Visi */}
            <div className="relative overflow-hidden border-2 border-white/10 bg-white/5 p-8">
              <div className="absolute right-0 top-0 h-20 w-20 bg-secondary/20 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-secondary">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
                    visibility
                  </span>
                </div>
                <span className="font-heading text-xs font-black uppercase tracking-widest text-secondary">Visi</span>
              </div>
              <p className="font-heading text-xl font-bold leading-relaxed text-white">
                Menjadi platform andalan akademi Taekwondo dan Karate di Indonesia untuk mengelola operasional sehari-hari.
              </p>
            </div>

            {/* Misi */}
            <div className="relative overflow-hidden border-2 border-white/10 bg-white/5 p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-white/10">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
                    flag
                  </span>
                </div>
                <span className="font-heading text-xs font-black uppercase tracking-widest text-white/50">Misi</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Menyediakan platform manajemen akademi yang mudah, terjangkau, dan siap pakai",
                  "Membantu akademi tampil lebih profesional secara digital",
                  "Merapikan pengelolaan data siswa, absensi, SPP, dan penilaian",
                  "Terus berkembang bersama masukan pengurus dan pelatih",
                ].map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 bg-secondary" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -- NILAI PLATFORM -- */}
      <section className="section-y bg-white pt-28">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Nilai Kami</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Prinsip yang<br />Kami Pegang
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Empat nilai yang menjadi fondasi setiap keputusan desain dan pengembangan SKAIHUB.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((val, i) => (
              <div
                key={val.title}
                className={`group relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 ${
                  i === 0
                    ? "bg-primary hover:shadow-[6px_6px_0px_theme(colors.secondary)]"
                    : i === 1
                    ? "bg-secondary hover:shadow-[6px_6px_0px_theme(colors.primary)]"
                    : "border-2 border-border bg-white hover:border-primary hover:shadow-[6px_6px_0px_theme(colors.primary)]"
                }`}
              >
                {/* Diagonal accent untuk card 1 & 2 */}
                {i < 2 && (
                  <div className="absolute right-0 top-0 h-16 w-16 bg-white/10 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                )}

                <div className={`mb-4 flex h-12 w-12 items-center justify-center ${
                  i < 2 ? "bg-white/20" : "bg-primary/5 group-hover:bg-primary/10"
                }`}>
                  <span
                    className={`material-symbols-outlined ${i < 2 ? "text-white" : "text-primary"}`}
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}
                  >
                    {val.icon}
                  </span>
                </div>

                <h3 className={`font-heading text-xl font-black uppercase ${i < 2 ? "text-white" : "text-primary"}`}>
                  {val.title}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${i < 2 ? "text-white/70" : "text-muted"}`}>
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="section-y bg-slate-50">
        <div className="container-app flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Bergabung</span>
            <div className="h-1 w-10 bg-secondary" />
          </div>
          <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
            Siap Bersama<br />SKAIHUB?
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted">
            Ceritakan kebutuhan akademi Anda. Tim SKAIHUB bantu pilih paket dan menyiapkan akun lewat WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={whatsappUrl}
              className="inline-flex w-full items-center justify-center gap-3 bg-secondary px-6 py-5 text-center text-xs font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_theme(colors.primary)] transition-all hover:-translate-y-1 hover:bg-secondary-dark sm:w-auto sm:px-10 sm:text-sm"
            >
              Hubungi via WhatsApp
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/harga"
              className="inline-flex w-full justify-center border-2 border-primary px-6 py-5 text-center text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-white sm:w-auto sm:px-10 sm:text-sm"
            >
              Lihat Paket Harga
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
