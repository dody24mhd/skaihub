import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan Layanan | SKAIHUB",
  description:
    "Syarat dan ketentuan penggunaan layanan platform SKAIHUB untuk akademi bela diri di Indonesia.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. Penerimaan Syarat",
    content: `Dengan mengakses atau menggunakan layanan SKAIHUB ("Platform"), Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak setuju dengan salah satu ketentuan, mohon tidak menggunakan Platform kami.`,
  },
  {
    title: "2. Deskripsi Layanan",
    content: `SKAIHUB adalah platform berbasis web untuk mengelola akademi bela diri, meliputi data siswa dan pelatih, jadwal dan absensi, SPP, evaluasi dan rapor siswa, serta sabuk dan UKT. Halaman publik akademi di subdomain nama.skaihub.com hanya tersedia untuk Paket Pro dan Scale.`,
  },
  {
    title: "3. Akun dan Keamanan",
    content: `Akun dibuat oleh tim SKAIHUB untuk pengurus akademi, lalu pengurus dapat menambahkan Admin dan Pelatih. Anda bertanggung jawab menjaga kerahasiaan kredensial akun. SKAIHUB tidak bertanggung jawab atas kerugian akibat akses tidak sah yang disebabkan kelalaian dalam menjaga akun. Segera hubungi kami jika Anda mencurigai ada akses tidak sah.`,
  },
  {
    title: "4. Pemisahan Data Antar Akademi",
    content: `Setiap akademi hanya dapat melihat dan mengelola datanya sendiri. Data milik satu akademi tidak dapat diakses oleh akademi lain.`,
  },
  {
    title: "5. Paket Berlangganan dan Pembayaran",
    content: `Layanan tersedia dalam paket Starter, Pro, dan Scale dengan harga bulanan sesuai halaman Harga. Pembayaran dilakukan di awal periode melalui transfer bank manual, lalu dikonfirmasi oleh tim SKAIHUB. Perubahan paket atau penambahan kuota siswa dilakukan lewat tim SKAIHUB. Tidak ada refund untuk periode yang sudah berjalan. Jika tidak ingin melanjutkan, Anda cukup tidak memperpanjang langganan.`,
  },
  {
    title: "6. Masa Aktif, Tenggang, dan Mode Baca-Saja",
    content: `Peringatan perpanjangan ditampilkan 14 hari sebelum masa aktif berakhir. Setelah masa aktif berakhir, akademi mendapat masa tenggang 7 hari. Jika belum diperpanjang setelah masa tenggang, akun berubah menjadi baca-saja: data tetap dapat dilihat, tetapi tidak dapat ditambah atau diubah sampai langganan diperpanjang.`,
  },
  {
    title: "7. Penghentian Layanan",
    content: `SKAIHUB berhak menangguhkan atau menghentikan akses jika terjadi pelanggaran terhadap syarat ini atau penggunaan Platform untuk tujuan yang melanggar hukum. Permintaan salinan atau penghapusan data akademi dapat diajukan melalui email hello@skaihub.com.`,
  },
  {
    title: "8. Kepemilikan Konten",
    content: `Konten yang Anda unggah ke Platform (foto, dokumen, data siswa) tetap menjadi milik Anda. SKAIHUB hanya menggunakan data tersebut untuk menjalankan layanan yang Anda gunakan. Kami tidak menjual atau membagikan data Anda kepada pihak ketiga tanpa izin Anda.`,
  },
  {
    title: "9. Batasan Tanggung Jawab",
    content: `SKAIHUB tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerusakan data yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan, sepanjang diizinkan oleh hukum yang berlaku di Indonesia.`,
  },
  {
    title: "10. Perubahan Syarat",
    content: `SKAIHUB dapat mengubah syarat dan ketentuan ini. Perubahan penting akan diberitahukan lewat WhatsApp kepada pengurus akademi minimal 14 hari sebelum berlaku. Penggunaan layanan setelah perubahan berlaku dianggap sebagai persetujuan atas syarat baru.`,
  },
  {
    title: "11. Hukum yang Berlaku",
    content: `Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah terlebih dahulu. Jika tidak tercapai kesepakatan, sengketa diselesaikan melalui pengadilan yang berwenang di Indonesia.`,
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute right-0 top-0 hidden h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] md:block" />
        <div className="container-app relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Legal</span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Syarat &amp;<br />
            <span className="text-secondary">Ketentuan</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Terakhir diperbarui: Mei 2026. Harap baca syarat ini sebelum menggunakan layanan SKAIHUB.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="section-y bg-white">
        <div className="container-app max-w-3xl">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-heading text-xl font-black uppercase text-primary mb-3">
                  {section.title}
                </h2>
                <p className="text-base leading-relaxed text-muted">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Contact note */}
          <div className="mt-16 border-2 border-primary/10 bg-slate-50 p-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-1 w-8 bg-secondary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Pertanyaan</span>
            </div>
            <p className="text-base leading-relaxed text-muted">
              Jika Anda memiliki pertanyaan terkait syarat dan ketentuan ini, silakan hubungi kami melalui halaman{" "}
              <Link href="/hubungi" className="font-bold text-primary underline hover:text-secondary">
                Hubungi Kami
              </Link>{" "}
              atau kirim email ke{" "}
              <a href="mailto:hello@skaihub.com" className="font-bold text-primary underline hover:text-secondary">
                hello@skaihub.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
