import { EXTRA_BLOCK_SIZE, EXTRA_BLOCK_SURCHARGE_PERCENT, effectiveStudentLimit, formatPlanPrice } from "@/lib/plan-pricing";
import type { HomeFaq } from "./compro-data";

// Shown when the CMS has no FAQ yet (and on the API-less demo); CMS entries always take precedence.
export const DEFAULT_FAQS: HomeFaq[] = [
  {
    q: "Apa itu SKAIHUB?",
    a: "SKAIHUB adalah platform manajemen akademi bela diri untuk Taekwondo dan Karate. Isinya data siswa dan pelatih, jadwal dan absensi, SPP, penilaian dan rapor, kenaikan sabuk (UKT), serta halaman web akademi untuk paket Pro dan Scale.",
  },
  {
    q: "Bagaimana cara mendaftarkan akademi?",
    a: "Hubungi tim SKAIHUB lewat WhatsApp. Kami bantu membuatkan akun, menyiapkan data awal, dan menjelaskan cara pemakaiannya kepada pengurus dan pelatih.",
  },
  {
    q: "Berapa biaya langganannya?",
    a: `Starter ${formatPlanPrice("starter")}, Pro ${formatPlanPrice("pro")}, dan Scale ${formatPlanPrice("scale")} per bulan. Semua paket punya fitur manajemen yang sama. Pro dan Scale ditambah halaman web akademi sendiri.`,
  },
  {
    q: "Bagaimana kuota siswa dihitung?",
    a: `Yang dihitung hanya siswa aktif, alumni dan siswa nonaktif tidak termasuk. Kuota sudah termasuk 1 blok gratis ${EXTRA_BLOCK_SIZE} siswa: Starter hingga ${effectiveStudentLimit("starter", 0)}, Pro hingga ${effectiveStudentLimit("pro", 0)}, dan Scale hingga ${effectiveStudentLimit("scale", 0)} siswa. Setiap tambahan ${EXTRA_BLOCK_SIZE} siswa dikenakan ${EXTRA_BLOCK_SURCHARGE_PERCENT}% dari harga paket per bulan.`,
  },
  {
    q: "Bagaimana cara pembayarannya?",
    a: "Pembayaran dilakukan lewat transfer bank. Setelah pembayaran kami konfirmasi, langganan akademi langsung diaktifkan atau diperpanjang oleh tim SKAIHUB.",
  },
  {
    q: "Apa yang terjadi jika langganan berakhir?",
    a: "Peringatan muncul 14 hari sebelum masa langganan berakhir. Setelah berakhir ada masa tenggang 7 hari dengan layanan tetap normal. Setelah itu akun menjadi baca-saja: data tetap bisa dilihat dan diekspor sampai langganan diperpanjang.",
  },
  {
    q: "Apakah bisa dipakai dari HP?",
    a: "Bisa. Tampilan dirancang untuk HP sehingga pelatih bisa mengisi absensi langsung di tempat latihan, dan dashboard bisa dipasang sebagai aplikasi di layar utama. Koneksi internet tetap diperlukan.",
  },
  {
    q: "Siapa saja yang bisa memakai SKAIHUB?",
    a: "Ketua akademi, admin, dan pelatih, masing-masing dengan hak akses sendiri. Pelatih misalnya fokus ke absensi dan penilaian, tanpa akses ke SPP. Siswa dan orang tua belum memiliki akun login.",
  },
  {
    q: "Apakah urutan sabuknya sesuai perguruan kami?",
    a: "Tersedia urutan sabuk Taekwondo Kukkiwon, Karate FORKI, dan Karate KKI. Akademi juga bisa menambahkan tingkatan atau strip sendiri sesuai kebiasaan di dojang.",
  },
];
