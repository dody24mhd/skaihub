import Link from "next/link";
import type { Metadata } from "next";
import { createWhatsAppUrl, OFFICE_HOURS } from "../_lib/whatsapp";
import { getHomeFaqs, getSiteSettings } from "../_lib/compro-data";
import PlanCardView from "../_components/plan-card";
import { MODULE_COUNT, PLAN_CARDS, PRODUCT_MODULES, planIncludesModule } from "../_lib/product";
import { EXTRA_BLOCK_SIZE, formatPlanPrice, PLAN_RULES, quotaNote } from "@/lib/plan-pricing";

export const metadata: Metadata = {
  title: "Harga Paket SKAIHUB",
  description:
    "Paket SKAIHUB Starter, Pro, dan Scale untuk operasional, absensi, SPP, evaluasi, dan website akademi bela diri. Konsultasi dan aktivasi lewat tim SKAIHUB.",
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

const billingInfo = [
  {
    icon: "account_balance",
    title: "Transfer Bank Manual",
    desc: "Pembayaran langganan lewat transfer bank. Aktivasi dan perpanjangan dibantu tim SKAIHUB lewat WhatsApp.",
  },
  {
    icon: "group_add",
    title: `1 Blok ${EXTRA_BLOCK_SIZE} Siswa Gratis`,
    desc: `Setiap paket sudah termasuk 1 blok tambahan ${EXTRA_BLOCK_SIZE} siswa tanpa biaya. Kuota di atas sudah memperhitungkannya.`,
  },
  {
    icon: "school",
    title: "Alumni Tidak Dihitung",
    desc: "Kuota hanya menghitung siswa aktif. Siswa nonaktif dan alumni tidak memakai kuota.",
  },
  {
    icon: "schedule",
    title: "Peringatan H-14",
    desc: "Peringatan muncul 14 hari sebelum masa aktif habis. Setelah habis ada masa tenggang 7 hari, lalu akun menjadi baca-saja sampai diperpanjang.",
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
            <span className="text-secondary">Aturan Jelas</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Tiga paket dengan harga bulanan tetap. Kuota siswa dan biaya tambahannya ditulis terbuka di bawah. Butuh pindah paket? Upgrade lewat tim SKAIHUB.
          </p>
        </div>
      </section>

      {/* -- PRICING CARDS -- */}
      <section className="section-y bg-white pt-28">
        <div className="container-app">
          <div className="grid gap-6 md:grid-cols-3 md:items-end">
            {PLAN_CARDS.map((plan) => (
              <PlanCardView key={plan.key} plan={plan} waNumber={waNumber} showForWho />
            ))}
          </div>
          <p data-testid="quota-note" className="mt-10 border-l-4 border-secondary bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            <span className="font-bold text-primary">Kuota siswa aktif: </span>
            {quotaNote()}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {billingInfo.map((item) => (
              <div key={item.title} className="border-2 border-border bg-white p-5">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}>
                  {item.icon}
                </span>
                <h3 className="mt-3 font-heading text-sm font-black uppercase text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
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
              Perbandingan {MODULE_COUNT} modul di setiap paket.
            </p>
          </div>

          <div className="overflow-x-auto border-2 border-border bg-white">
            <div className="min-w-[820px]">
            {/* Header */}
            <div className="grid grid-cols-4 border-b-2 border-border bg-primary">
              <div className="p-4 text-xs font-black uppercase tracking-widest text-white/40">Modul</div>
              {PLAN_CARDS.map((plan) => (
                <div key={plan.key} className={`border-l border-white/10 p-4 text-center ${plan.highlighted ? "bg-secondary/20" : ""}`}>
                  <p className="font-heading text-sm font-black uppercase text-white">{PLAN_RULES[plan.key].label}</p>
                  <p className="mt-0.5 text-xs text-white/40">{formatPlanPrice(plan.key)}/bln</p>
                </div>
              ))}
            </div>

            {/* Rows */}
            {PRODUCT_MODULES.map((mod, i) => (
              <div key={mod.name} className={`grid grid-cols-4 border-b border-border last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-primary/5">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "16px" }}>
                      {mod.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{mod.name}</p>
                    <p className="text-xs text-muted">{mod.summary}</p>
                  </div>
                </div>
                {PLAN_CARDS.map((plan) => (
                  <div key={plan.key} className={`flex items-center justify-center border-l border-border p-4 ${plan.highlighted ? "bg-secondary/5" : ""}`}>
                    {planIncludesModule(plan.key, mod) ? (
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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Konsultasi</span>
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
            <p className="text-xs text-white/30">{OFFICE_HOURS}</p>
          </div>
        </div>
      </section>

    </div>
  );
}
