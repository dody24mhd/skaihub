import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { getSiteSettings } from "../_lib/compro-data";
import { MODULE_COUNT, PRODUCT_MODULES, PUBLIC_SITE_PLAN_LABEL } from "../_lib/product";

export const metadata: Metadata = {
  title: "Fitur Aplikasi Manajemen Akademi Bela Diri",
  description:
    "Fitur SKAIHUB untuk data siswa, jadwal dan absensi, SPP, evaluasi dan rapor siswa, sabuk dan UKT, serta website publik akademi (Paket Pro & Scale). Untuk Taekwondo dan Karate.",
  alternates: {
    canonical: "/fitur",
  },
  openGraph: {
    title: "Fitur Aplikasi Manajemen Akademi Bela Diri | SKAIHUB",
    description:
      "Kelola data siswa, absensi, SPP, rapor siswa, sabuk dan UKT, serta website publik akademi dalam satu platform.",
    url: "/fitur",
  },
};

type ModuleDetail = {
  short: string;
  desc: string;
  bullets: string[];
  mockup: string;
};

const moduleDetails: Record<string, ModuleDetail> = {
  data: {
    short: "Data siswa, wali, kelas, dan pelatih dalam satu tempat.",
    desc: "Simpan biodata siswa lengkap dengan foto, kelas utama, tingkatan, dan kontak. Nama dan nomor wali wajib diisi untuk siswa di bawah 17 tahun, jadi kontak orang tua tidak tercecer.",
    bullets: [
      "Biodata, foto, kelas utama, dan tingkatan siswa",
      "Kontak wali wajib untuk siswa di bawah 17 tahun",
      "Status aktif, nonaktif, atau alumni",
      "Kelas, tempat latihan, dan data pelatih",
      "Ekspor daftar siswa ke CSV",
    ],
    mockup: "/images/mockups/mockup-data.png",
  },
  jadwal: {
    short: "Kelas Hari Ini dari jadwal rutin, absen langsung dari HP.",
    desc: "Atur jadwal rutin per kelas, tempat, dan pelatih. Setiap hari sesinya muncul di Kelas Hari Ini, pelatih tinggal mencatat kehadiran dan materi latihan.",
    bullets: [
      "Jadwal rutin mingguan per kelas, tempat, dan pelatih",
      "Kelas Hari Ini dibuat otomatis dari jadwal",
      "Pindah jadwal, batalkan sesi, atau ganti pelatih",
      "Absensi Hadir, Izin, Sakit, Alpa dengan materi, catatan, dan foto",
      "Absensi susulan oleh pelatih hingga 7 hari ke belakang",
    ],
    mockup: "/images/mockups/mockup-operasional.png",
  },
  spp: {
    short: "Tagihan bulanan, pembayaran, dan tunggakan.",
    desc: "Tentukan SPP bulanan per kelas, atau pakai nominal default akademi. Buat tagihan sebulan sekaligus, catat pembayaran, lalu bagikan kuitansi lewat WhatsApp.",
    bullets: [
      "SPP bulanan per kelas dengan nominal default akademi",
      "Buat tagihan bulanan untuk semua siswa aktif",
      "Pembayaran sebagian dan pembebasan SPP dengan alasan",
      "Status jatuh tempo dan daftar tunggakan",
      "Kuitansi siap cetak, bisa dibagikan lewat tautan WhatsApp",
      "Ringkasan keuangan untuk Ketua dan ekspor CSV",
    ],
    mockup: "/images/mockups/mockup-laporan.png",
  },
  evaluasi: {
    short: "Nilai per aspek, rapor siap cetak.",
    desc: "Buat periode evaluasi dan aspek penilaian sesuai standar akademi. Pelatih memberi nilai 1 sampai 100 yang langsung tampil sebagai predikat, lalu rapor siswa bisa dicetak atau disimpan sebagai PDF.",
    bullets: [
      "Periode evaluasi sesuai kebutuhan akademi",
      "Aspek penilaian bisa diatur dan disalin dari periode lain",
      "Nilai 1 sampai 100 dengan predikat Kurang, Cukup, Baik, Sangat Baik",
      "Catatan pelatih per siswa",
      "Rapor siap cetak, simpan sebagai PDF lewat fitur cetak browser",
      "Ekspor rekap evaluasi ke CSV",
    ],
    mockup: "/images/mockups/mockup-laporan.png",
  },
  sabuk: {
    short: "Event UKT, riwayat tingkatan, dan sertifikat.",
    desc: "Catat event UKT, daftarkan peserta, lalu isi hasilnya. Tingkatan siswa yang lulus diperbarui otomatis dan sertifikat UKT siap dicetak.",
    bullets: [
      "Sistem sabuk Taekwondo Kukkiwon, Karate FORKI, dan Karate KKI",
      "Event UKT dengan daftar peserta",
      "Nilai, hasil lulus atau tidak lulus, dan catatan",
      "Tingkatan siswa diperbarui otomatis saat lulus",
      "Riwayat tingkatan dan prestasi per siswa",
      "Sertifikat UKT siap cetak",
    ],
    mockup: "/images/mockups/mockup-data.png",
  },
  website: {
    short: "Halaman profil akademi di nama.skaihub.com.",
    desc: "Akademi di Paket Pro dan Scale mendapat halaman publik sendiri. Tampilkan profil, foto hero, galeri, prestasi, pengurus, pelatih, tempat latihan, dan tombol WhatsApp.",
    bullets: [
      "Alamat sendiri: nama.skaihub.com",
      "Profil akademi, logo, dan warna tema",
      "Foto hero dan galeri",
      "Prestasi, pengurus, dan pelatih akademi",
      "Daftar tempat latihan beserta alamat",
      "Tombol WhatsApp untuk calon siswa",
    ],
    mockup: "/images/mockups/mockup-website.png",
  },
};

const modules = PRODUCT_MODULES.map((module, index) => ({
  ...module,
  ...moduleDetails[module.id],
  label: String(index + 1).padStart(2, "0"),
  flip: index % 2 === 1,
}));

const extras = [
  { icon: "badge", text: "Akses sesuai peran: Ketua, Admin, dan Pelatih" },
  { icon: "install_mobile", text: "Bisa dipasang di HP seperti aplikasi (PWA)" },
  { icon: "download", text: "Ekspor data siswa, SPP, dan evaluasi ke CSV" },
];

const beforeAfter = [
  { aspect: "Data Siswa", before: "Buku catatan dan file terpisah", after: "Data siswa dan wali di satu tempat, bisa diekspor ke CSV" },
  { aspect: "Absensi", before: "Daftar hadir kertas", after: "Kelas Hari Ini, absen Hadir, Izin, Sakit, Alpa dari HP" },
  { aspect: "Iuran SPP", before: "Catatan di buku kas", after: "Tagihan bulanan, pembayaran sebagian, daftar tunggakan" },
  { aspect: "Rapor Siswa", before: "Ditulis tangan", after: "Nilai per aspek, rapor siap cetak atau simpan PDF" },
  { aspect: "Kenaikan Sabuk", before: "Catatan terpisah dan mudah hilang", after: "Event UKT tercatat, tingkatan diperbarui otomatis, sertifikat siap cetak" },
  { aspect: "Profil Online", before: "Hanya media sosial", after: "Halaman akademi di nama.skaihub.com (Paket Pro & Scale)" },
];

export default async function FiturPage() {
  const settings = await getSiteSettings();
  const waNumber = settings.whatsapp_number;
  const whatsappUrl = createWhatsAppUrl(
    "Halo SKAIHUB, saya ingin bertanya tentang fitur SKAIHUB.",
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Fitur Platform</span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Semua yang Akademi<br />
            <span className="text-secondary">Anda Butuhkan</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            {MODULE_COUNT} modul yang saling terhubung, dari absensi harian sampai website publik akademi. Untuk Taekwondo dan Karate.
          </p>
        </div>
      </section>

      {/* -- OVERVIEW MODUL -- */}
      <section className="section-y bg-white">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">{MODULE_COUNT} Modul</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Satu Platform,<br />{MODULE_COUNT} Modul
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
              Setiap modul dirancang untuk menyelesaikan satu masalah nyata yang dihadapi pengurus akademi setiap hari.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modules.map((mod) => (
              <a
                key={mod.id}
                href={`#${mod.id}`}
                className="group relative flex flex-col gap-4 border-2 border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[6px_6px_0px_theme(colors.primary)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center bg-primary transition-colors duration-300 group-hover:bg-secondary">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}>
                      {mod.icon}
                    </span>
                  </div>
                  <span className="font-heading text-3xl font-black text-slate-100 transition-colors duration-300 group-hover:text-primary/10">
                    {mod.label}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-base font-black uppercase text-primary">{mod.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{mod.short}</p>
                  {mod.publicSiteOnly && (
                    <span className="mt-3 inline-flex bg-secondary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
                      {PUBLIC_SITE_PLAN_LABEL}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Lihat Detail
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 md:grid-cols-3">
            {extras.map((item) => (
              <li key={item.text} className="flex items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <span className="material-symbols-outlined flex-shrink-0 text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -- DETAIL PER MODUL -- */}
      {modules.map((mod, idx) => (
        <section
          key={mod.id}
          id={mod.id}
          className={`section-y ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"}`}
        >
          <div className="container-app">
            <div className={`flex flex-col gap-12 lg:flex-row lg:items-center ${mod.flip ? "lg:flex-row-reverse" : ""}`}>

              {/* Mockup */}
              <div className="relative w-full lg:w-1/2">
                <div className="group relative aspect-[4/3] w-full overflow-hidden bg-[#0a2040] shadow-[12px_12px_0px_theme(colors.secondary)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[16px_16px_0px_theme(colors.secondary)]">
                  <Image
                    src={mod.mockup}
                    alt={mod.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                                  </div>
                {/* Label nomor */}
                <div className="absolute -bottom-4 -left-4 bg-primary px-4 py-2 transition-all duration-300 group-hover:bg-secondary">
                  <span className="font-heading text-xs font-black uppercase tracking-widest text-white">Modul {mod.label}</span>
                </div>
              </div>

              {/* Konten */}
              <div className="w-full lg:w-1/2">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-secondary">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>
                      {mod.icon}
                    </span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
                    {mod.publicSiteOnly ? PUBLIC_SITE_PLAN_LABEL : `Modul ${mod.label}`}
                  </span>
                </div>

                <h2 className="font-heading text-3xl font-black uppercase leading-tight text-primary md:text-4xl">
                  {mod.name}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted">{mod.desc}</p>

                <ul className="mt-6 space-y-3">
                  {mod.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-secondary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}>
                        check_circle
                      </span>
                      <span className="text-slate-700">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* -- COMPARISON -- */}
      <section className="relative bg-primary py-24 [clip-path:polygon(0_4%,100%_0,100%_96%,0_100%)]">
        <div className="container-app relative z-10">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Perbandingan</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                Sebelum vs<br />Sesudah SKAIHUB
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60 md:text-right">
              Dari catatan manual ke satu sistem yang rapi dan mudah dicek.
            </p>
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto border-2 border-white/10">
            <div className="min-w-[720px]">
            {/* Header */}
            <div className="grid grid-cols-3 bg-white/5">
              <div className="p-4 text-xs font-black uppercase tracking-widest text-white/40">Aspek</div>
              <div className="border-l border-white/10 p-4 text-xs font-black uppercase tracking-widest text-white/40">Sebelum</div>
              <div className="border-l border-secondary/50 bg-secondary/10 p-4 text-xs font-black uppercase tracking-widest text-secondary">Dengan SKAIHUB</div>
            </div>
            {/* Rows */}
            {beforeAfter.map((row, i) => (
              <div key={row.aspect} className={`grid grid-cols-3 border-t border-white/10 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                <div className="p-4 text-sm font-bold text-white/70">{row.aspect}</div>
                <div className="border-l border-white/10 p-4 text-sm text-white/40">{row.before}</div>
                <div className="border-l border-secondary/30 bg-secondary/5 p-4 text-sm font-medium text-white/80">{row.after}</div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="relative overflow-hidden bg-white py-24">
        <div className="container-app flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1 w-10 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Konsultasi</span>
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
              Tertarik?<br />Hubungi Kami
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Tim SKAIHUB bantu menyiapkan akun akademi Anda. Konsultasi gratis lewat WhatsApp.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link
              href={whatsappUrl}
              className="inline-flex w-full items-center justify-center gap-3 bg-secondary px-6 py-5 text-center text-xs font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_theme(colors.primary)] transition-all hover:-translate-y-1 hover:bg-secondary-dark sm:w-auto sm:px-10 sm:text-sm"
            >
              Hubungi via WhatsApp
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link href="/harga" className="text-sm font-black uppercase tracking-widest text-primary underline underline-offset-4 hover:text-secondary">
              Lihat Paket & Harga
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
