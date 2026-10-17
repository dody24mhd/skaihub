import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { getSiteSettings } from "../_lib/compro-data";

export const metadata: Metadata = {
  title: "Fitur Aplikasi Manajemen Akademi Bela Diri",
  description:
    "Fitur SKAIHUB untuk data siswa, jadwal latihan, absensi, SPP, rapor digital, kenaikan sabuk/kyu, dan website publik akademi. Mendukung Taekwondo dan Karate.",
  alternates: {
    canonical: "/fitur",
  },
  openGraph: {
    title: "Fitur Aplikasi Manajemen Akademi Bela Diri | SKAIHUB",
    description:
      "Kelola data siswa, absensi, SPP, rapor digital, kenaikan sabuk/kyu, dan website publik akademi dalam satu platform.",
    url: "/fitur",
  },
};

const modules = [
  {
    id: "data",
    icon: "group",
    label: "01",
    title: "Data & Manajemen",
    short: "Semua data siswa dan pelatih dalam satu tempat.",
    desc: "Kelola profil lengkap setiap siswa — dari biodata, foto, data orang tua, hingga riwayat sabuk dan prestasi personal. Tidak ada lagi data yang tercecer di grup WhatsApp atau buku catatan.",
    bullets: [
      "Biodata lengkap siswa & orang tua terintegrasi",
      "Foto profil & nomor KTA",
      "Status aktif, tidak aktif, atau alumni",
      "Riwayat sabuk & prestasi per siswa",
      "Data pelatih: lisensi, DAN level, spesialisasi",
    ],
    mockup: "/images/mockups/mockup-data.png",
    flip: false,
  },
  {
    id: "jadwal",
    icon: "event_available",
    label: "02",
    title: "Jadwal & Latihan",
    short: "Absensi harian dan log materi dalam satu form.",
    desc: "Pelatih buka dashboard, lihat jadwal hari ini, langsung input kehadiran dan catat materi latihan — semua dalam satu alur tanpa berpindah halaman.",
    bullets: [
      "Jadwal mingguan per hari dan lokasi",
      "Absensi manual — centang langsung dari dashboard",
      "Log materi latihan terintegrasi di form absensi",
      "Rekap kehadiran per siswa per periode",
      "Riwayat sesi latihan tersimpan otomatis",
    ],
    mockup: "/images/mockups/mockup-operasional.png",
    flip: true,
  },
  {
    id: "sabuk",
    icon: "military_tech",
    label: "03",
    title: "Riwayat Tingkatan",
    short: "Dokumentasi UKT/UKD rapi, sabuk/kyu update otomatis.",
    desc: "Catat event UKT yang diikuti siswa, input nilai dan hasil, lalu sistem otomatis update sabuk/kyu siswa yang lulus. Upload sertifikat fisik sebagai dokumentasi digital.",
    bullets: [
      "Buat event UKT/UKD per periode",
      "Daftar peserta & input nilai per siswa",
      "Hasil lulus/tidak lulus dengan catatan",
      "Update sabuk/kyu otomatis jika lulus",
      "Upload sertifikat UKT per siswa (PDF/foto)",
    ],
    mockup: "/images/mockups/mockup-website.png",
    flip: false,
  },
  {
    id: "rapor",
    icon: "description",
    label: "04",
    title: "Evaluasi Siswa",
    short: "Rapor digital per periode, dimensi bisa dikustom.",
    desc: "Buat periode rapor sendiri, tentukan dimensi dan indikator penilaian sesuai standar akademi Anda. Input nilai per siswa, tambah catatan pelatih, dan ekspor PDF siap cetak.",
    bullets: [
      "Periode rapor custom (3 bulan, semester, dll)",
      "Template dimensi penilaian default tersedia",
      "Dimensi & indikator bisa diedit per akademi",
      "Input nilai + catatan pelatih per siswa",
      "Ekspor PDF rapor individual siap cetak",
    ],
    mockup: "/images/mockups/mockup-laporan.png",
    flip: true,
  },
  {
    id: "spp",
    icon: "payments",
    label: "05",
    title: "Keuangan & SPP",
    short: "Catat iuran bulanan, pantau tunggakan.",
    desc: "Nominal SPP diset saat registrasi siswa. Setiap bulan tinggal update status bayar — Lunas, Belum, atau Cicil. Rekap tunggakan tersedia otomatis.",
    bullets: [
      "Nominal SPP per siswa (bisa berbeda-beda)",
      "Status bayar per bulan: Lunas / Belum / Cicil",
      "Catat tanggal & metode pembayaran",
      "Rekap tunggakan siswa otomatis",
      "Ekspor laporan SPP ke Excel",
    ],
    mockup: "/images/mockups/mockup-website.png",
    flip: false,
  },
  {
    id: "landing",
    icon: "language",
    label: "06",
    title: "Website Publik Akademi",
    short: "Alamat web sendiri, tampil profesional online.",
    desc: "Paket Pro dan Scale mendapat alamat web unik seperti namaakademi.skaihub.com. Tampilkan profil, lokasi latihan, galeri, prestasi akademi, dan CTA WhatsApp dari halaman akademi sendiri.",
    bullets: [
      "Alamat unik: namaakademi.skaihub.com",
      "Profil akademi: logo, tagline, deskripsi, tema warna",
      "Jadwal latihan & galeri foto publik",
      "Profil pelatih & prestasi akademi",
      "Form pendaftaran online (leads capture)",
      "Kontak, sosmed, Google Maps embed",
    ],
    mockup: "/images/mockups/mockup-website.png",
    flip: true,
  },
];

const beforeAfter = [
  { aspect: "Data Siswa", before: "Buku catatan / Excel", after: "Dashboard digital, bisa diakses kapan saja" },
  { aspect: "Absensi", before: "Kertas daftar hadir manual", after: "Centang langsung dari HP, rekap otomatis" },
  { aspect: "Iuran SPP", before: "Catatan di buku kas", after: "Status bayar per siswa, rekap tunggakan otomatis" },
  { aspect: "Rapor Siswa", before: "Tulis tangan atau Excel", after: "Input nilai digital, Ekspor PDF siap cetak" },
  { aspect: "Kenaikan Sabuk/Kyu", before: "Catatan terpisah, tidak terdokumentasi", after: "Event UKT/UKD tercatat, sabuk/kyu update otomatis" },
  { aspect: "Profil Online", before: "Tidak ada / hanya Instagram", after: "Website profesional dengan alamat akademi sendiri" },
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
            <span className="text-secondary">Kamu Butuhkan</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            6 modul terintegrasi — dari pencatatan harian hingga website publik akademi. Mendukung Taekwondo dan Karate.
          </p>
        </div>
      </section>

      {/* -- OVERVIEW 6 MODUL -- */}
      <section className="section-y bg-white">
        <div className="container-app">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1 w-10 bg-secondary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">6 Modul</span>
              </div>
              <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
                Satu Platform,<br />Enam Modul
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
                  <h3 className="font-heading text-base font-black uppercase text-primary">{mod.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{mod.short}</p>
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
                    alt={mod.title}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Overlay tipis saat hover — dihapus */}
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
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">{mod.title}</span>
                </div>

                <h2 className="font-heading text-3xl font-black uppercase leading-tight text-primary md:text-4xl">
                  {mod.title}
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
              Dari manual ke digital — perbedaannya terasa dari hari pertama.
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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Mulai Sekarang</span>
            </div>
            <h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
              Tertarik?<br />Hubungi Kami
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Tim SKAIHUB siap membantu setup akademi Anda. Konsultasi gratis via WhatsApp.
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
