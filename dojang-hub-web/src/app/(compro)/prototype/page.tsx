import Link from "next/link";

export const metadata = { title: "Style Prototype - SKAIHUB" };

// ============================================================
// STYLE A: Modern SaaS — Clean, gradient, rounded
// Referensi: Vercel, Linear, tapi lebih warm & lokal
// ============================================================
function StyleA() {
  return (
    <section className="relative overflow-hidden bg-[#031636] px-6 py-32 text-white">
      {/* Gradient blob */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#E63946]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Label */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest text-white/60 uppercase backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E63946] animate-pulse" />
          Platform Manajemen Akademi Bela Diri
        </div>

        {/* Headline */}
        <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
          Kelola Akademi Lebih{" "}
          <span className="bg-gradient-to-r from-[#E63946] to-orange-400 bg-clip-text text-transparent">
            Profesional
          </span>
          , Fokus Cetak Juara
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Satu platform untuk absensi, rapor, manajemen siswa, dan website akademi. Tidak perlu Excel, tidak perlu WhatsApp grup.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="#" className="rounded-xl bg-[#E63946] px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(230,57,70,0.4)] transition hover:-translate-y-0.5 hover:bg-[#c62828]">
            Daftarkan Akademi Sekarang
          </Link>
          <Link href="#" className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10">
            Lihat Demo ?
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap gap-10 border-t border-white/10 pt-10">
          {[["50+", "Akademi Aktif"], ["1.200+", "Siswa Terdata"], ["3 Menit", "Setup Awal"]].map(([num, label]) => (
            <div key={label}>
              <p className="text-3xl font-black text-white">{num}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STYLE B: Sporty Bold — Energik, diagonal, kontras tinggi
// Referensi: Nike, Strava, platform olahraga
// ============================================================
function StyleB() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-0">
      {/* Diagonal background split */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 right-0 h-full w-[55%] bg-[#031636] [clip-path:polygon(15%_0%,100%_0%,100%_100%,0%_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl items-center gap-0">
        {/* Kiri */}
        <div className="w-full py-24 pr-8 md:w-[50%]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-1 w-12 bg-[#E63946]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#E63946]">Taekwondo Management</span>
          </div>
          <h1 className="font-heading text-6xl font-black uppercase leading-[0.9] tracking-tighter text-[#031636] md:text-8xl">
            FOKUS<br />
            <span className="text-[#E63946]">CETAK</span><br />
            JUARA
          </h1>
          <p className="mt-8 max-w-sm text-base font-medium leading-relaxed text-slate-500">
            Sistem digital untuk akademi yang serius. Absensi, ujian, rapor, dan profil online — semua dalam satu platform.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="#" className="bg-[#E63946] px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-[#c62828]">
              Mulai Sekarang
            </Link>
            <Link href="#" className="border-2 border-[#031636] px-8 py-4 text-sm font-black uppercase tracking-widest text-[#031636] transition hover:bg-[#031636] hover:text-white">
              Lihat Fitur
            </Link>
          </div>
        </div>

        {/* Kanan — Stats di atas dark bg */}
        <div className="hidden w-[50%] flex-col items-center justify-center gap-8 py-24 pl-16 md:flex">
          {[
            { num: "50+", label: "Akademi Aktif", sub: "di seluruh Indonesia" },
            { num: "1.2K+", label: "Siswa Terdata", sub: "profil lengkap tersimpan" },
            { num: "100%", label: "Bebas Repot", sub: "administrasi otomatis" },
          ].map((s) => (
            <div key={s.label} className="w-full border-b border-white/10 pb-8 last:border-0">
              <p className="text-5xl font-black text-white">{s.num}</p>
              <p className="mt-1 text-base font-bold text-white/80">{s.label}</p>
              <p className="text-sm text-white/40">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STYLE C: Warm Local — Friendly, card-based, approachable
// Referensi: Majoo, Mekari — SaaS lokal Indonesia
// ============================================================
function StyleC() {
  return (
    <section className="bg-[#FFF8F0] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Top badge */}
        <div className="mb-8 flex justify-center">
          <span className="rounded-full bg-[#E63946]/10 px-5 py-2 text-sm font-bold text-[#E63946]">
            Platform Khusus Akademi Bela Diri Indonesia
          </span>
        </div>

        {/* Headline — centered */}
        <h1 className="text-center text-5xl font-bold leading-tight text-[#031636] md:text-6xl">
          Akademi Kamu Layak Tampil{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-[#E63946]">Profesional</span>
            <span className="absolute -bottom-1 left-0 z-0 h-3 w-full bg-[#E63946]/15 rounded" />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-500">
          Dari absensi harian sampai evaluasi siswa, semua bisa dikelola dari HP. Tidak perlu keahlian teknis, langsung bisa pakai.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="#" className="rounded-2xl bg-[#E63946] px-10 py-4 text-base font-bold text-white shadow-lg shadow-[#E63946]/30 transition hover:-translate-y-1">
            Coba Gratis 14 Hari
          </Link>
          <Link href="#" className="rounded-2xl border-2 border-[#031636]/10 bg-white px-10 py-4 text-base font-bold text-[#031636] transition hover:border-[#031636]/30">
            Lihat Demo
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: "??", title: "Absensi Digital", desc: "QR Code scan, rekap otomatis, tidak ada lagi kertas." },
            { icon: "??", title: "Manajemen UKT", desc: "Jadwal ujian, hasil, dan sertifikat sabuk dalam satu alur." },
            { icon: "??", title: "Website Akademi", desc: "Landing page profesional dengan alamat akademi sendiri." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="text-base font-bold text-[#031636]">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          <span>Sudah dipakai 50+ akademi</span>
          <span>? Setup dalam 3 menit</span>
          <span>? Support via WhatsApp</span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAGE — Tampilkan semua 3 style dengan label
// ============================================================
export default function PrototypePage() {
  return (
    <div className="font-sans">
      {/* Nav pilihan */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-black/90 py-3 text-xs font-bold text-white backdrop-blur">
        <span className="text-white/40">PILIH STYLE:</span>
        <a href="#style-a" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">A — Modern SaaS</a>
        <a href="#style-b" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">B — Sporty Bold</a>
        <a href="#style-c" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">C — Warm Local</a>
      </div>

      {/* Style A */}
      <div id="style-a">
        <div className="flex items-center justify-center gap-3 bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
          <span className="h-px w-12 bg-slate-300" />
          Style A — Modern SaaS
          <span className="h-px w-12 bg-slate-300" />
        </div>
        <StyleA />
      </div>

      {/* Style B */}
      <div id="style-b">
        <div className="flex items-center justify-center gap-3 bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
          <span className="h-px w-12 bg-slate-300" />
          Style B — Sporty Bold
          <span className="h-px w-12 bg-slate-300" />
        </div>
        <StyleB />
      </div>

      {/* Style C */}
      <div id="style-c">
        <div className="flex items-center justify-center gap-3 bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
          <span className="h-px w-12 bg-slate-300" />
          Style C — Warm Local
          <span className="h-px w-12 bg-slate-300" />
        </div>
        <StyleC />
      </div>

      {/* Footer pilihan */}
      <div className="bg-black py-12 text-center text-white">
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Mana yang paling klik?</p>
        <p className="mt-2 text-lg font-bold">A (Modern SaaS) · B (Sporty Bold) · C (Warm Local)</p>
        <p className="mt-2 text-sm text-white/40">Atau kombinasi — misal hero B, section lain C</p>
      </div>
    </div>
  );
}
