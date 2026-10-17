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
    content: `Dengan mengakses atau menggunakan layanan SKAIHUB ("Platform"), Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan salah satu ketentuan di sini, mohon untuk tidak menggunakan Platform kami.`,
  },
  {
    title: "2. Deskripsi Layanan",
    content: `SKAIHUB adalah platform Software as a Service (SaaS) yang menyediakan sistem manajemen digital untuk akademi bela diri, termasuk namun tidak terbatas pada manajemen siswa, absensi, kenaikan sabuk/kyu, rapor digital, dan website publik akademi berbasis subdomain.`,
  },
  {
    title: "3. Akun dan Keamanan",
    content: `Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda. SKAIHUB tidak bertanggung jawab atas kerugian yang timbul akibat akses tidak sah yang disebabkan oleh kelalaian Anda dalam menjaga keamanan akun. Segera hubungi kami jika Anda mencurigai adanya akses tidak sah.`,
  },
  {
    title: "4. Isolasi Data Antar Akademi",
    content: `Setiap akademi beroperasi secara terisolasi di dalam platform. Data milik satu akademi tidak dapat diakses oleh akademi lain. SKAIHUB menerapkan kontrol akses ketat di setiap lapisan sistem untuk memastikan privasi dan keamanan data Anda.`,
  },
  {
    title: "5. Paket Berlangganan dan Pembayaran",
    content: `Layanan SKAIHUB tersedia dalam beberapa paket berlangganan bulanan (Starter, Pro, Scale). Pembayaran dilakukan di awal periode berlangganan. Tidak ada refund untuk periode yang sudah berjalan. Anda dapat menghentikan langganan kapan saja tanpa penalti, berlaku di periode billing berikutnya.`,
  },
  {
    title: "6. Penghentian Layanan",
    content: `SKAIHUB berhak menangguhkan atau menghentikan akses Anda jika terjadi pelanggaran terhadap syarat ini, keterlambatan pembayaran yang signifikan, atau penggunaan Platform untuk tujuan yang melanggar hukum. Setelah penghentian, data akademi akan disimpan selama 30 hari sebelum dihapus permanen.`,
  },
  {
    title: "7. Kepemilikan Konten",
    content: `Konten yang Anda unggah ke Platform (foto, dokumen, data siswa) tetap menjadi milik Anda. SKAIHUB hanya menggunakan data tersebut untuk keperluan operasional layanan yang Anda berlangganan. Kami tidak akan menjual atau membagikan data Anda kepada pihak ketiga tanpa izin Anda.`,
  },
  {
    title: "8. Batasan Tanggung Jawab",
    content: `SKAIHUB tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerusakan data yang timbul dari penggunaan atau ketidakmampuan penggunaan layanan kami, sepanjang diizinkan oleh hukum yang berlaku di Indonesia.`,
  },
  {
    title: "9. Perubahan Syarat",
    content: `SKAIHUB berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam platform minimal 14 hari sebelum berlaku. Penggunaan layanan setelah perubahan berlaku dianggap sebagai penerimaan syarat baru.`,
  },
  {
    title: "10. Hukum yang Berlaku",
    content: `Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa yang timbul akan diselesaikan secara musyawarah, dan jika tidak tercapai kesepakatan, diselesaikan melalui pengadilan yang berwenang di Indonesia.`,
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
