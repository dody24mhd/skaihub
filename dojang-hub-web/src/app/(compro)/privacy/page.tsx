import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | SKAIHUB",
  description:
    "Kebijakan privasi SKAIHUB: bagaimana kami mengumpulkan, menggunakan, dan melindungi data akademi dan pengguna platform.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi yang Anda berikan saat konsultasi, aktivasi akun, dan penggunaan layanan, termasuk nama akademi, nama pengurus, alamat email, nomor WhatsApp, serta data operasional akademi (data siswa dan wali, pelatih, absensi, SPP, evaluasi, dan riwayat sabuk). Server kami juga dapat mencatat data teknis dasar seperti alamat IP dan jenis browser untuk menjaga keamanan layanan.`,
  },
  {
    title: "2. Bagaimana Kami Menggunakan Data",
    content: `Data digunakan untuk menjalankan dan memperbaiki layanan, menjaga keamanan akun, menghubungi pengurus akademi lewat WhatsApp terkait layanan (misalnya pembaruan sistem dan perpanjangan langganan), serta memberikan bantuan teknis.`,
  },
  {
    title: "3. Pemisahan Data Akademi",
    content: `Setiap akademi memiliki ruang data sendiri. Data siswa, pelatih, dan operasional satu akademi tidak dapat dilihat atau diubah oleh akademi lain. Komunikasi antara browser dan server dilindungi HTTPS.`,
  },
  {
    title: "4. Berbagi Data dengan Pihak Ketiga",
    content: `Kami tidak menjual atau menyewakan data Anda. Data hanya dibagikan kepada penyedia infrastruktur (hosting dan penyimpanan file) yang diperlukan untuk menjalankan layanan, dan kepada pihak berwenang jika diwajibkan oleh hukum yang berlaku di Indonesia.`,
  },
  {
    title: "5. Halaman Publik Akademi",
    content: `Untuk akademi di Paket Pro dan Scale, informasi yang dipilih pengurus untuk ditampilkan (profil, foto, galeri, prestasi, pengurus, pelatih, tempat latihan, dan nomor WhatsApp akademi) dapat dilihat publik di nama.skaihub.com. Data internal seperti absensi, SPP, dan nilai siswa tidak ditampilkan di halaman publik.`,
  },
  {
    title: "6. Penyimpanan dan Retensi Data",
    content: `Data akademi disimpan selama akademi menggunakan layanan. Jika langganan berakhir dan masa tenggang 7 hari terlewati, akun menjadi baca-saja dan data tetap tersimpan. Anda dapat meminta salinan atau penghapusan data akademi melalui email hello@skaihub.com.`,
  },
  {
    title: "7. Cookie dan Penyimpanan Browser",
    content: `Aplikasi SKAIHUB menyimpan token login di penyimpanan browser agar Anda tetap masuk. Kami tidak memasang cookie iklan atau pelacakan lintas situs.`,
  },
  {
    title: "8. Hak Anda atas Data",
    content: `Anda berhak mengakses data akademi Anda, meminta koreksi data yang tidak akurat, mengunduh data (misalnya ekspor CSV di dalam aplikasi), dan meminta penghapusan data akademi. Untuk menggunakan hak ini, hubungi kami di hello@skaihub.com.`,
  },
  {
    title: "9. Keamanan",
    content: `Kami menjaga data dengan langkah yang wajar, termasuk koneksi HTTPS, password yang disimpan dalam bentuk hash, dan pembatasan akses sesuai peran (Ketua, Admin, dan Pelatih). Tidak ada sistem yang sepenuhnya bebas risiko, jadi segera laporkan kepada kami jika Anda menemukan masalah keamanan.`,
  },
  {
    title: "10. Perubahan Kebijakan Privasi",
    content: `Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan diberitahukan lewat WhatsApp kepada pengurus akademi minimal 14 hari sebelum berlaku. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan atas kebijakan baru.`,
  },
  {
    title: "11. Kontak untuk Privasi",
    content: `Untuk pertanyaan atau permintaan terkait privasi data, hubungi kami di hello@skaihub.com.`,
  },
];

export default function PrivacyPage() {
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
            Kebijakan<br />
            <span className="text-secondary">Privasi</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Terakhir diperbarui: Mei 2026. Privasi data Anda adalah prioritas kami.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="section-y bg-white">
        <div className="container-app max-w-3xl">

          {/* Intro box */}
          <div className="mb-12 border-l-4 border-secondary bg-secondary/5 p-6">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Komitmen Kami</p>
            <p className="text-base leading-relaxed text-muted">
              SKAIHUB berkomitmen untuk melindungi privasi dan keamanan data akademi yang menggunakan platform kami. Kebijakan ini menjelaskan bagaimana kami mengelola data Anda.
            </p>
          </div>

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
              Ada pertanyaan tentang kebijakan privasi ini? Hubungi kami melalui{" "}
              <Link href="/hubungi" className="font-bold text-primary underline hover:text-secondary">
                halaman Hubungi Kami
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
