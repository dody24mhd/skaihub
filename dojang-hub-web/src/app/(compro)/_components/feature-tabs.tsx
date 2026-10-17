"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const featureTabs = [
  {
    id: "website",
    icon: "language",
    title: "Website Akademi",
    subtitle: "Paket Pro & Scale.",
    desc: "Halaman publik di nama.skaihub.com berisi profil, foto hero, galeri, prestasi, pengurus, pelatih, dan tombol WhatsApp untuk calon siswa.",
    image: "/images/mockups/mockup-website.png",
  },
  {
    id: "operasional",
    icon: "event_available",
    title: "Kelas Hari Ini",
    subtitle: "Absensi langsung dari HP.",
    desc: "Sesi muncul otomatis dari jadwal rutin. Pelatih mencatat Hadir, Izin, Sakit, atau Alpa beserta materi, catatan, dan foto. Sesi bisa dipindah jadwal, dibatalkan, atau diganti pelatihnya.",
    image: "/images/mockups/mockup-operasional.png",
  },
  {
    id: "laporan",
    icon: "description",
    title: "SPP & Rapor",
    subtitle: "Tagihan dan evaluasi rapi.",
    desc: "Buat tagihan SPP bulanan, catat pembayaran sebagian, dan pantau tunggakan. Nilai siswa per aspek, lalu cetak rapor per periode atau simpan sebagai PDF.",
    image: "/images/mockups/mockup-laporan.png",
  },
  {
    id: "data",
    icon: "database",
    title: "Data Terpusat",
    subtitle: "Satu tempat untuk data akademi.",
    desc: "Data siswa dan wali, kelas, tempat latihan, pelatih, riwayat sabuk, dan prestasi tersimpan rapi. Ekspor ke CSV kapan pun dibutuhkan.",
    image: "/images/mockups/mockup-data.png",
  },
];

const TAB_DURATION = 6000;

function getTime() {
  return window.performance.now();
}

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const goToTab = (index: number) => {
    setActiveTab(index);
    setProgress(0);
    startTimeRef.current = getTime();
  };

  useEffect(() => {
    startTimeRef.current = getTime();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = getTime() - startTimeRef.current;
      const p = (elapsed / TAB_DURATION) * 100;
      if (p >= 100) {
        setProgress(0);
        setActiveTab((c) => (c + 1) % featureTabs.length);
      } else {
        setProgress(p);
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTab]);

  return (
    <div className="mt-12 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">

      {/* Tab list kiri */}
      <div className="flex flex-col gap-2 lg:col-span-5">
        {featureTabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <button
              key={tab.id}
              onClick={() => goToTab(index)}
              className={`group relative flex w-full items-start gap-4 overflow-hidden p-5 text-left transition-all duration-300 ${
                isActive
                  ? "bg-white shadow-[6px_6px_0px_theme(colors.secondary)]"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {/* Progress bar kiri */}
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-white/10">
                  <div
                    className="absolute left-0 top-0 w-full bg-secondary"
                    style={{ height: `${progress}%`, transition: "none" }}
                  />
                </div>
              )}

              {/* Icon */}
              <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center transition-colors duration-300 ${
                isActive ? "bg-secondary text-white" : "bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/80"
              }`}>
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {tab.icon}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-heading text-base font-black uppercase transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-white/60 group-hover:text-white/90"
                }`}>
                  {tab.title}
                </h3>
                <p className={`mt-0.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  isActive ? "text-secondary" : "text-white/30"
                }`}>
                  {tab.subtitle}
                </p>

                {/* Desc accordion */}
                <div className={`grid transition-all duration-500 ${
                  isActive ? "grid-rows-[1fr] mt-3 opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}>
                  <p className="overflow-hidden text-sm leading-relaxed text-muted">
                    {tab.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mockup kanan */}
      <div className="relative lg:col-span-7">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a2040] shadow-[12px_12px_0px_theme(colors.secondary)]">

          {/* Watermark overlay di atas gambar tab Rapor */}
          <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-700 ${activeTab === 2 ? "opacity-100" : "opacity-0"}`}>
            <span className="select-none font-heading font-black uppercase text-white/[0.07]" style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}>
              SKAIHUB
            </span>
          </div>{featureTabs.map((tab, index) => (
            <div
              key={`img-${tab.id}`}
              className={`absolute inset-0 transition-all duration-700 ${
                activeTab === index
                  ? "z-10 translate-y-0 opacity-100"
                  : "z-0 translate-y-8 opacity-0"
              }`}
            >
              <Image
                src={tab.image}
                alt={tab.title}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Tab counter di atas mockup pojok kanan atas */}
        <div className="absolute -top-4 -right-4 bg-secondary px-4 py-2 z-20">
          <span className="font-heading text-xs font-black uppercase tracking-widest text-white">
            0{activeTab + 1} / 0{featureTabs.length}
          </span>
        </div>
      </div>

    </div>
  );
}
