import { effectiveStudentLimit, formatPlanPrice, PLAN_RULES, type PlanKey } from "@/lib/plan-pricing";

/**
 * Daftar modul produk yang dipakai bersama oleh halaman beranda, /fitur, dan /harga
 * supaya jumlah dan nama modul selalu sama di seluruh situs.
 */
export type ProductModule = {
  id: string;
  icon: string;
  name: string;
  summary: string;
  /** true bila modul hanya tersedia di paket Pro & Scale. */
  publicSiteOnly: boolean;
};

export const PRODUCT_MODULES: readonly ProductModule[] = [
  {
    id: "data",
    icon: "group",
    name: "Data Siswa & Pelatih",
    summary: "Siswa, wali, kelas, tempat latihan, dan pelatih",
    publicSiteOnly: false,
  },
  {
    id: "jadwal",
    icon: "event_available",
    name: "Jadwal & Absensi",
    summary: "Jadwal rutin, Kelas Hari Ini, dan absensi",
    publicSiteOnly: false,
  },
  {
    id: "spp",
    icon: "payments",
    name: "SPP & Keuangan",
    summary: "Tagihan bulanan, pembayaran, dan tunggakan",
    publicSiteOnly: false,
  },
  {
    id: "evaluasi",
    icon: "description",
    name: "Evaluasi & Rapor",
    summary: "Penilaian per aspek dan rapor siap cetak",
    publicSiteOnly: false,
  },
  {
    id: "sabuk",
    icon: "military_tech",
    name: "Sabuk & UKT",
    summary: "Event UKT, riwayat tingkatan, dan sertifikat",
    publicSiteOnly: false,
  },
  {
    id: "website",
    icon: "language",
    name: "Website Publik Akademi",
    summary: "Halaman profil akademi di nama.skaihub.com",
    publicSiteOnly: true,
  },
];

export const MODULE_COUNT = PRODUCT_MODULES.length;

export const PUBLIC_SITE_PLAN_LABEL = "Paket Pro & Scale";

export type PlanCard = {
  key: PlanKey;
  name: string;
  tag: string | null;
  desc: string;
  forWho: string;
  price: string;
  access: string;
  icon: string | null;
  highlighted: boolean;
  features: { text: string; included: boolean }[];
};

type PlanCopy = Pick<PlanCard, "tag" | "desc" | "forWho" | "access" | "icon" | "highlighted">;

const PLAN_COPY: Record<PlanKey, PlanCopy> = {
  starter: {
    tag: null,
    desc: "Untuk akademi yang baru mulai rapi secara digital",
    forWho: `Akademi hingga ${effectiveStudentLimit("starter", 0)} siswa aktif yang ingin merapikan operasional harian`,
    access: "app.skaihub.com",
    icon: "assignment",
    highlighted: false,
  },
  pro: {
    tag: "Rekomendasi",
    desc: "Operasional lengkap plus website akademi",
    forWho: `Akademi hingga ${effectiveStudentLimit("pro", 0)} siswa aktif yang juga butuh halaman publik`,
    access: "nama.skaihub.com",
    icon: null,
    highlighted: true,
  },
  scale: {
    tag: null,
    desc: "Kapasitas lebih besar untuk akademi yang padat",
    forWho: `Akademi hingga ${effectiveStudentLimit("scale", 0)} siswa aktif dengan banyak kelas`,
    access: "nama.skaihub.com",
    icon: "military_tech",
    highlighted: false,
  },
};

export const PLAN_KEYS: readonly PlanKey[] = ["starter", "pro", "scale"];

export function planIncludesModule(plan: PlanKey, module: ProductModule): boolean {
  return !module.publicSiteOnly || plan !== "starter";
}

export const PLAN_CARDS: readonly PlanCard[] = PLAN_KEYS.map((key) => ({
  key,
  name: PLAN_RULES[key].label,
  price: formatPlanPrice(key),
  ...PLAN_COPY[key],
  features: [
    { text: `Kuota ${effectiveStudentLimit(key, 0)} siswa aktif`, included: true },
    ...PRODUCT_MODULES.map((module) => ({
      text: module.name,
      included: planIncludesModule(key, module),
    })),
  ],
}));

/** Pesan WhatsApp standar untuk tombol konsultasi paket. */
export function planConsultMessage(planName: string): string {
  return `Halo SKAIHUB, saya ingin konsultasi paket ${planName}. Bisa dibantu penjelasannya?`;
}
