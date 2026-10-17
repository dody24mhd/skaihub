import Link from "next/link";
import type { Metadata } from "next";
import HeroSlider from "./_components/hero-slider";
import FeatureTabs from "./_components/feature-tabs";
import PlanCardView from "./_components/plan-card";
import {
  getHomeTestimonials,
  getPublicBlogPosts,
  getPublicEvents,
  getSiteSettings,
} from "./_lib/compro-data";
import { createWhatsAppUrl, OFFICE_HOURS } from "./_lib/whatsapp";
import { MODULE_COUNT, PLAN_CARDS, PLAN_KEYS, PUBLIC_SITE_PLAN_LABEL } from "./_lib/product";
import { quotaNote } from "@/lib/plan-pricing";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const prices = PLAN_CARDS;

function formatShortDate(value: string | null) {
  if (!value) return "Tanggal menyusul";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const [testimonials, events, blogPosts, settings] = await Promise.all([
    getHomeTestimonials(),
    getPublicEvents(2),
    getPublicBlogPosts(2),
    getSiteSettings(),
  ]);

  const waNumber = settings.whatsapp_number;
  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin konsultasi untuk digitalisasi akademi bela diri.",
    waNumber,
  );

  return (
    <div className="bg-white">
      {/* -- HERO ----------------------------------------------- */}
      <HeroSlider waNumber={waNumber} />

      {/* -- STATS BAR ------------------------------------------ */}
      {/* Diagonal cut top, dark bg, bold numbers */}
      <section className="relative bg-primary py-12 [clip-path:polygon(0_0,100%_0,100%_80%,0_100%)]">
        <div className="container-app">
          <div className="flex flex-wrap items-center justify-between gap-8">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-10">
              {[
                { num: String(MODULE_COUNT), label: "Modul Utama" },
                { num: String(PLAN_KEYS.length), label: "Pilihan Paket" },
                { num: "Gratis", label: "Konsultasi Awal" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-10">
                  {i > 0 && <div className="h-8 w-px bg-white/10" />}
                  <div>
                    <p className="font-heading text-4xl font-black text-white">{s.num}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Trusted by */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Dirancang untuk</p>
              <div className="flex flex-wrap items-center gap-6">
                {["AKADEMI BARU", "AKADEMI AKTIF", "KETUA & ADMIN AKADEMI", "PELATIH"].map((name) => (
                  <span key={name} className="font-heading text-sm font-black tracking-tight text-white/20 transition hover:text-white/60">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- BENEFITS / BENTO ----------------------------------- */}
      {/* White bg, bold section label, asymmetric grid */}
      <section className="section-y bg-white pt-24">
        <div className="container-app">
          {/* Section header — left-aligned, sporty */}
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Platform</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Semua Kebutuhan<br />Akademi Bela Diri
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Dirancang khusus untuk akademi Taekwondo dan Karate. Dari absensi harian sampai SPP, semua tercatat rapi dan bisa dibuka dari HP.
            </p>
          </div>

          {/* Bento grid — sporty cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1 — wide, dark */}
            <div className="group relative overflow-hidden bg-primary p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_theme(colors.secondary)] md:col-span-2">
              <div className="absolute -right-8 -top-8 h-32 w-32 rotate-12 bg-secondary/20 transition-transform duration-500 group-hover:scale-150" />
              <div className="absolute right-4 top-4 h-1 w-16 bg-secondary" />
              <div className="relative z-10 mb-6 inline-flex bg-white/10 p-3 transition-colors duration-300 group-hover:bg-white/20">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>
                  sports_martial_arts
                </span>
              </div>
              <h3 className="relative z-10 font-heading text-2xl font-black uppercase text-white">
                Latihan Lebih Terarah
              </h3>
              <p className="relative z-10 mt-3 max-w-md text-sm leading-relaxed text-white/60">
                Sesi muncul otomatis di Kelas Hari Ini dari jadwal rutin. Pelatih mencatat Hadir, Izin, Sakit, atau Alpa, lalu menambah materi, catatan, dan foto latihan.
              </p>
            </div>

            {/* Card 2 — red accent */}
            <div className="group relative overflow-hidden bg-secondary p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_theme(colors.primary)]">
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
              <div className="mb-6 inline-flex bg-white/20 p-3 transition-colors duration-300 group-hover:bg-white/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="relative z-10 font-heading text-2xl font-black uppercase text-white">
                Administrasi Bebas Repot
              </h3>
              <p className="relative z-10 mt-3 text-sm leading-relaxed text-white/80">
                Buat tagihan SPP bulanan, catat pembayaran sebagian, dan pantau tunggakan dari HP. Kuitansi siap cetak atau dibagikan lewat WhatsApp.
              </p>
            </div>

            {/* Card 3 — full width, diagonal split */}
            <div className="group relative overflow-hidden bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_theme(colors.primary)] md:col-span-3">
              <div className="absolute right-0 top-0 h-full w-2/5 bg-primary transition-all duration-500 [clip-path:polygon(20%_0%,100%_0%,100%_100%,0%_100%)] group-hover:[clip-path:polygon(15%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
              <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-1 w-8 bg-secondary" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Reputasi</span>
                  </div>
                  <h3 className="font-heading text-3xl font-black uppercase leading-tight text-primary">
                    Bangun Reputasi Akademi yang Profesional
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    Calon siswa bisa melihat profil, galeri, prestasi, pengurus, dan pelatih akademi Anda, lalu langsung menghubungi lewat tombol WhatsApp.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-center md:pr-8">
                  <span className="inline-flex items-center gap-2 bg-primary px-4 py-2 font-heading text-base font-black text-white md:bg-white/10">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>language</span>
                    nama.skaihub.com
                  </span>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted md:text-white/60">{PUBLIC_SITE_PLAN_LABEL}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- FEATURES / TABS ------------------------------------ */}
      {/* Dark bg section, diagonal top cut */}
      <section id="fitur" className="relative bg-primary py-24 [clip-path:polygon(0_4%,100%_0,100%_96%,0_100%)]">
        <div className="relative z-10 container-app">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Fitur</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                Satu Platform,<br />Berbagai Solusi
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/80 md:text-right">
              SKAIHUB merapikan alur publik, operasional, dan evaluasi siswa dalam satu sistem yang mudah dipantau.
            </p>
          </div>
          <FeatureTabs />
        </div>
      </section>

      {/* -- PRICING -------------------------------------------- */}
      <section id="harga" className="section-y bg-white pt-28">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Investasi</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Harga Transparan,<br />Sesuai Kebutuhan
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Tiga paket dengan fitur inti yang sama. Bedanya ada di kuota siswa dan website publik akademi.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:items-end">
            {prices.map((plan) => (
              <PlanCardView key={plan.key} plan={plan} waNumber={waNumber} />
            ))}
          </div>
          <p data-testid="quota-note" className="mt-10 border-l-4 border-secondary bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            <span className="font-bold text-primary">Kuota siswa aktif: </span>
            {quotaNote()}{" "}
            <Link href="/harga" className="font-bold text-primary underline underline-offset-4 hover:text-secondary">
              Lihat detail paket
            </Link>
          </p>
        </div>
      </section>

      {/* -- NEWS & EVENTS -------------------------------------- */}
      <section className="section-y bg-slate-50">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
                  Update
                </span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Berita & Event<br />Terbaru
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/event"
                className="inline-flex items-center gap-2 border-2 border-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary transition hover:bg-primary hover:text-white"
              >
                Lihat Event
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                href="/berita"
                className="inline-flex items-center gap-2 bg-secondary px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-secondary-dark"
              >
                Baca Berita
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card-soft bg-white p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="font-heading text-xl font-black uppercase text-primary">
                  Event
                </h3>
                <span className="material-symbols-outlined text-secondary">event</span>
              </div>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map((event) => (
                    <Link href={`/event/${event.slug}`} key={event.slug} className="group block border-t border-border pt-4 first:border-t-0 first:pt-0 transition hover:bg-slate-50 -mx-6 px-6 pb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-secondary group-hover:text-primary transition">
                        {formatShortDate(event.startsAt)}
                      </p>
                      <h4 className="mt-2 font-heading text-lg font-black uppercase text-primary group-hover:underline">
                        {event.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-muted">{event.excerpt}</p>
                      <p className="mt-3 text-sm font-bold text-primary">{event.location}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted italic">Belum ada agenda event terbaru saat ini.</p>
                )}
              </div>
            </section>

            <section className="card-soft bg-white p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="font-heading text-xl font-black uppercase text-primary">
                  Berita
                </h3>
                <span className="material-symbols-outlined text-secondary">newspaper</span>
              </div>
              <div className="space-y-4">
                {blogPosts.length > 0 ? (
                  blogPosts.map((post) => (
                    <Link href={`/berita/${post.slug}`} key={post.slug} className="group block border-t border-border pt-4 first:border-t-0 first:pt-0 transition hover:bg-slate-50 -mx-6 px-6 pb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-secondary group-hover:text-primary transition">
                        {post.category} / {formatShortDate(post.publishedAt)}
                      </p>
                      <h4 className="mt-2 font-heading text-lg font-black uppercase text-primary group-hover:underline">
                        {post.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
                      <p className="mt-3 text-sm font-bold text-primary">{post.authorName}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted italic">Belum ada publikasi artikel terbaru saat ini.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* -- TESTIMONIALS --------------------------------------- */}
      <section className="relative overflow-hidden bg-slate-50 py-24">
        {/* Diagonal accent top-right */}
        <div className="absolute right-0 top-0 h-48 w-48 bg-secondary/5 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Testimoni</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Suara Mereka<br />yang Sudah Digital
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Bukti sederhana dari akademi yang mulai merapikan operasionalnya.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.length > 0 ? (
              testimonials.map((item, i) => (
                <article
                  key={item.name}
                  className={`group relative flex flex-col gap-6 overflow-hidden p-8 transition-all duration-300 ${
                    i === 1
                      ? "bg-primary text-white shadow-[6px_6px_0px_theme(colors.secondary)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_theme(colors.secondary)]"
                      : "border-2 border-border bg-white hover:-translate-y-1 hover:border-primary/30 hover:shadow-[6px_6px_0px_theme(colors.primary)]"
                  }`}
                >
                  {/* Diagonal accent — card tengah */}
                  {i === 1 && (
                    <>
                      <div className="absolute -right-0 -top-0 h-20 w-20 bg-secondary/20 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                      <div className="absolute -right-0 -top-0 h-12 w-12 bg-secondary/30 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
                    </>
                  )}

                  {/* Quote mark */}
                  <span className={`font-heading text-7xl font-black leading-none transition-colors duration-300 ${
                    i === 1 ? "text-white/10 group-hover:text-white/20" : "text-primary/8 group-hover:text-primary/15"
                  }`}>&ldquo;</span>

                  {/* Quote text */}
                  <p className={`-mt-10 flex-1 text-sm leading-relaxed ${i === 1 ? "text-white/80" : "text-muted"}`}>
                    {item.quote}
                  </p>

                  {/* Author */}
                  <div className={`flex items-center gap-4 border-t pt-6 ${i === 1 ? "border-white/10" : "border-border"}`}>
                    {/* Avatar dengan inisial */}
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center font-heading text-sm font-black ${
                      i === 1 ? "bg-secondary text-white" : i === 0 ? "bg-primary text-white" : "bg-slate-100 text-primary"
                    }`}>
                      {item.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase ${i === 1 ? "text-white" : "text-primary"}`}>
                        {item.name}
                      </p>
                      <p className={`text-xs font-semibold ${i === 1 ? "text-white/40" : "text-muted"}`}>
                        {item.academy}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="md:col-span-3 py-12 text-center text-sm text-muted italic">
                Belum ada testimoni yang diterbitkan saat ini.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* -- CTA FINAL ------------------------------------------ */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        {/* Diagonal red block */}
        <div className="absolute right-0 top-0 h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="absolute right-0 top-0 h-full w-1/5 bg-secondary/20 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] hidden md:block" />
        <div className="relative z-10 container-app flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Konsultasi</span>
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">
              Siap Mendigitalkan<br />Akademi Anda?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/50">
              Ceritakan kebutuhan akademi Anda. Tim SKAIHUB bantu pilih paket dan menyiapkan akun lewat WhatsApp.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link
              href={whatsappUrl}
              className="inline-flex w-full items-center justify-center gap-3 bg-secondary px-6 py-5 text-center text-xs font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 hover:bg-secondary-dark sm:w-auto sm:px-10 sm:text-sm"
            >
              Hubungi via WhatsApp
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <p className="text-xs text-white/30">{OFFICE_HOURS}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
