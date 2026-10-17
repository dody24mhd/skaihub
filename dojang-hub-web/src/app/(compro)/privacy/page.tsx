import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | SKAIHUB",
  description:
    "Kebijakan privasi SKAIHUB — bagaimana kami mengumpulkan, menggunakan, dan melindungi data akademi dan pengguna platform.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. Informasi yang Kami Kumpulkan",
    content: `Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar atau menggunakan layanan, termasuk: nama akademi, nama admin, alamat email, nomor WhatsApp, dan data operasional akademi (data siswa, pelatih, absensi, rapor). Kami juga mengumpulkan data teknis seperti log akses, browser, dan alamat IP untuk keamanan sistem.`,
  },
  {
    title: "2. Bagaimana Kami Menggunakan Data",
    content: `Data yang kami kumpulkan digunakan untuk: menyediakan dan meningkatkan layanan platform, memverifikasi identitas dan keamanan akun, mengirim notifikasi terkait layanan (pembaruan sistem, tagihan), menganalisis penggunaan platform secara agregat untuk perbaikan produk, dan menghubungi Anda untuk keperluan dukungan teknis.`,
  },
  {
    title: "3. Isolasi dan Keamanan Data Akademi",
    content: `Setiap akademi memiliki ruang data yang terisolasi sepenuhnya. Data siswa, pelatih, dan operasional satu akademi tidak dapat dilihat, diakses, atau dimodifikasi oleh akademi lain maupun pihak ketiga mana pun. Seluruh data disimpan dengan enkripsi dan komunikasi dilindungi menggunakan HTTPS.`,
  },
  {
    title: "4. Berbagi Data dengan Pihak Ketiga",
    content: `Kami tidak menjual atau menyewakan data Anda kepada pihak ketiga. Data hanya dibagikan kepada: penyedia infrastruktur cloud (untuk hosting dan penyimpanan file) berdasarkan perjanjian kerahasiaan, dan pihak berwenang jika diwajibkan oleh hukum yang berlaku di Indonesia.`,
  },
  {
    title: "5. Penyimpanan dan Retensi Data",
    content: `Data akademi aktif disimpan selama masa berlangganan aktif. Setelah langganan berakhir atau dihentikan, data akan disimpan selama 30 hari sebagai masa tenggang, kemudian dihapus secara permanen dari sistem kami. Anda dapat mengekspor data sebelum periode ini berakhir.`,
  },
  {
    title: "6. Cookie dan Pelacakan",
    content: `Platform SKAIHUB menggunakan cookie sesi untuk autentikasi dan keamanan akun. Kami tidak menggunakan cookie untuk iklan atau pelacakan lintas situs. Website publik (skaihub.com) mungkin menggunakan analitik anonim (Google Analytics) untuk memahami pengunjung secara agregat.`,
  },
  {
    title: "7. Hak Anda atas Data",
    content: `Anda memiliki hak untuk: mengakses data yang kami simpan tentang akademi Anda, meminta koreksi data yang tidak akurat, mengunduh salinan data akademi Anda, dan meminta penghapusan data akademi Anda. Untuk menggunakan hak ini, hubungi kami melalui email hello@skaihub.com.`,
  },
  {
    title: "8. Keamanan Sistem",
    content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data Anda, termasuk: enkripsi data saat transit (HTTPS/TLS), enkripsi password (bcrypt), pemisahan data antar akademi, pemantauan akses dan log audit, serta backup otomatis harian.`,
  },
  {
    title: "9. Perubahan Kebijakan Privasi",
    content: `Kebijakan privasi ini dapat diperbarui dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau notifikasi dalam platform minimal 14 hari sebelum berlaku. Penggunaan layanan setelah perubahan dianggap sebagai penerimaan kebijakan baru.`,
  },
  {
    title: "10. Kontak untuk Privasi",
    content: `Untuk pertanyaan, kekhawatiran, atau permintaan terkait privasi data Anda, silakan hubungi kami di hello@skaihub.com. Kami berkomitmen untuk merespons dalam waktu 5 hari kerja.`,
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
              SKAIHUB berkomitmen untuk melindungi privasi dan keamanan data akademi yang menggunakan platform kami. Kebijakan ini menjelaskan secara transparan bagaimana kami mengelola data Anda.
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
