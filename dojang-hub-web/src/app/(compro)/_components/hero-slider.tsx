"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { createWhatsAppUrl } from "../_lib/whatsapp";

const slides = [
  {
    label: "Platform Manajemen Bela Diri",
    title: ["SATU PLATFORM", "BERBAGAI", "SOLUSI"],
    highlight: 1,
    desc: "Sistem manajemen operasional untuk absensi, rapor pengembangan, jadwal materi kurikulum, dan laporan SPP. Mendukung Taekwondo dan Karate.",
    image: "/images/photos/taekwondo-latihan-kelas.webp",
    focus: "55% center",
  },
  {
    label: "Reputasi Digital",
    title: ["PILIHAN UTAMA", "DI KOTA ANDA"],
    highlight: 0,
    desc: "Website profil menampilkan identitas, prestasi, dan form pendaftaran online langsung dari alamat web akademi Anda.",
    image: "/images/photos/taekwondo-penghargaan-sekolah-1.webp",
    focus: "48% center",
  },
  {
    label: "Kurikulum & Prestasi",
    title: ["CETAK JUARA", "DENGAN SISTEM", "TERINTEGRASI"],
    highlight: 0,
    desc: "Dari kurikulum, jadwal materi latihan harian dan teknik per sabuk/kyu, hingga pencatatan prestasi akademi — semua dalam satu sistem.",
    image: "/images/photos/taekwondo-podium-kejurnas.webp",
    focus: "62% center",
  },
];

const SLIDE_DURATION = 5500;

export default function HeroSlider({ waNumber }: { waNumber?: string }) {
  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin mendaftarkan akademi dan melihat demo platform.",
    waNumber,
  );

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  // Refs to avoid stale closures inside the single persistent interval
  const activeRef = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    startRef.current = performance.now();
  }, []);

  const goToSlide = useCallback((index: number) => {
    setActive(index);
    setProgress(0);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    // Single persistent interval — never restarts on slide change
    resetTimer();

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min((elapsed / SLIDE_DURATION) * 100, 100);

      if (p >= 100) {
        // Advance to next slide using ref (no stale closure)
        const next = (activeRef.current + 1) % slides.length;
        setActive(next);
        setProgress(0);
        startRef.current = performance.now();
      } else {
        setProgress(p);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← single mount — interval lives for component lifetime

  return (
    <section className="relative min-h-[720px] w-full overflow-hidden bg-[#031636] md:h-screen md:min-h-[640px]">

      {/* -- Foto segitiga kanan — dengan overlay gelap supaya tidak terlalu terang -- */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {slides.map((item, i) => (
          <div
            key={i}
            // The photo only fills the panel from 45% to the right edge, so `focus` picks what stays visible.
            // Same diagonal as before: 62%/52% of the full width, re-expressed inside the 55%-wide panel.
            className={`absolute inset-y-0 left-[45%] right-0 transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: `url(${item.image})`,
              backgroundSize: "cover",
              backgroundPosition: item.focus,
              clipPath: "polygon(30.9% 0%, 100% 0%, 100% 100%, 12.7% 100%)",
            }}
          />
        ))}
        {/* Overlay gelap di atas foto supaya blend dengan navy */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(62% 0%, 100% 0%, 100% 100%, 52% 100%)",
            background: "rgba(3,22,54,0.45)",
          }}
        />
      </div>

      {/* -- Shadow navy — gradient menutupi tepi foto dari kiri -- */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background: "linear-gradient(to right, #031636 44%, #031636f0 50%, #031636bb 57%, #03163644 65%, transparent 73%)",
        }}
      />

      {/* -- Icon watermark — sudut kiri bawah -- */}
      <div className="pointer-events-none absolute -bottom-8 -left-20 opacity-[0.05] select-none md:-left-8 md:opacity-[0.06]">
        <span
          className="material-symbols-outlined text-white"
          style={{ fontSize: "clamp(240px, 42vw, 380px)", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
        >
          sports_martial_arts
        </span>
      </div>

      {/* -- Strip trapesium merah solid di tepi miring -- */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          clipPath: "polygon(61% 0%, 63.2% 0%, 53.2% 100%, 51% 100%)",
          background: "#d32f2f",
        }}
      />

      {/* -- Content kiri — solid navy, bersih -- */}
      <div className="container-app relative z-10 flex min-h-[720px] items-center md:h-full md:min-h-0">
        <div className="w-full max-w-xl py-16 md:py-24">

          {/* Label */}
          <div className="mb-6 inline-flex items-center gap-3 md:mb-8">
            <div className="h-[3px] w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-secondary">
              {slides[active].label}
            </span>
          </div>

          {/* Headline — fixed height, slide absolute di dalamnya */}
          <div className="relative" style={{ height: "clamp(180px, 30vw, 300px)" }}>
            {slides.map((s, i) => (
              <h1
                key={i}
                className={`absolute inset-0 font-heading font-black uppercase leading-[0.88] tracking-tight transition-all duration-700 ease-out
                  ${i === active
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-6 opacity-0 pointer-events-none"
                  }`}
                style={{ fontSize: "clamp(2.75rem, 5.5vw, 5rem)" }}
              >
                {s.title.map((line, li) => (
                  <span key={li} className="block">
                    <span className={li === s.highlight ? "text-secondary" : "text-white"}>
                      {line}
                    </span>
                  </span>
                ))}
              </h1>
            ))}
          </div>

          {/* Description — fixed height */}
          <div className="relative mt-5" style={{ height: "92px" }}>
            {slides.map((s, i) => (
              <p
                key={i}
                className={`absolute inset-0 max-w-md text-base leading-relaxed text-white/60 transition-all duration-500 delay-100
                  ${i === active
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-4 opacity-0 pointer-events-none"
                  }`}
              >
                {s.desc}
              </p>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap md:mt-10">
            <Link
              href={whatsappUrl}
              className="inline-flex w-full items-center justify-center gap-3 bg-secondary px-5 py-4 text-center text-xs font-black uppercase tracking-widest text-white shadow-[5px_5px_0px_rgba(255,255,255,0.08)] transition-all hover:-translate-y-0.5 hover:bg-secondary-dark sm:w-auto sm:px-8 sm:text-sm"
            >
              Daftarkan Akademi Sekarang
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="#fitur"
              className="inline-flex w-full justify-center border-2 border-white/20 px-5 py-4 text-center text-xs font-black uppercase tracking-widest text-white/70 transition-all hover:border-white/50 hover:text-white sm:w-auto sm:px-8 sm:text-sm"
            >
              Pelajari Fitur
            </Link>
          </div>

          {/* Indicators */}
          <div className="mt-10 flex items-center gap-4 md:mt-16">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="relative h-[3px] overflow-hidden bg-white/15 transition-all duration-300"
                style={{ width: i === active ? "56px" : "24px" }}
              >
                {i === active && (
                  <span
                    className="absolute inset-y-0 left-0 bg-secondary"
                    style={{ width: `${progress}%`, transition: "none" }}
                  />
                )}
              </button>
            ))}
            <span className="ml-2 font-heading text-xs font-black tracking-widest text-white/25">
              0{active + 1} / 0{slides.length}
            </span>
          </div>

        </div>
      </div>

    </section>
  );
}
