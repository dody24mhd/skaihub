import { Page, Route } from "@playwright/test";

// Fixture L5-C (rapor & sertifikat). Didaftarkan paling akhir agar diprioritaskan Playwright;
// request lain diteruskan dengan route.fallback().

export const L5C_CERTIFICATE_NUMBER = "UKT/2026/0001/0001";

const REPORT = {
  akademi: { name: "Dojang Garuda Nusantara", logo_url: null, sport_type: "taekwondo" },
  student: {
    id: 1,
    name: "Arya Pratama Wicaksono Putra",
    member_number: "TKD-0001",
    gender: "male",
    birth_date: "2014-03-02",
    joined_date: "2025-01-10",
    photo_url: null,
    class_name: "Junior A",
    training_place: "GOR Garuda",
    rank: { id: 2, code: "tkd-geup-8", label: "Geup 8 (Kuning strip hijau)", belt_color: "yellow", stripe_color: "green" },
  },
  period: { id: 1, name: "Semester Ganjil 2026/2027", starts_at: "2026-07-01", ends_at: "2026-12-31", status: "active" },
  attendance: { total: 20, present: 16, sick: 2, excused: 1, absent: 1, rate: 80 },
  scores: [
    { aspect_id: 1, aspect: "Kicking (Tae)", category: "Teknik", score: 88, indicator: "baik", notes: "Tendangan sudah stabil, tingkatkan kecepatan." },
    { aspect_id: 2, aspect: "Poomsae", category: "Teknik", score: 92, indicator: "sangat_baik", notes: null },
    { aspect_id: 3, aspect: "Disiplin", category: "Sikap", score: 58, indicator: "kurang", notes: "Sering terlambat." },
  ],
  average: 79.3,
  average_indicator: "baik",
  assessors: ["Sabeum Budi"],
  generated_at: "2026-10-17",
};

const CERTIFICATE = {
  certificate_number: L5C_CERTIFICATE_NUMBER,
  akademi: { name: "Dojang Garuda Nusantara", logo_url: null, sport_type: "taekwondo" },
  student: { id: 1, name: "Arya Pratama Wicaksono Putra", member_number: "TKD-0001" },
  event: { id: 1, name: "UKT Geup Periode Oktober 2026", event_date: "2026-10-25" },
  from_rank: { id: 1, code: "tkd-geup-9", label: "Geup 9 (Kuning)", belt_color: "yellow", stripe_color: null },
  to_rank: { id: 2, code: "tkd-geup-8", label: "Geup 8 (Kuning strip hijau)", belt_color: "yellow", stripe_color: "green" },
  score: 85,
  assessor: "Sabeum Budi",
  chair_name: "Ketua Akademi Dojang",
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function setupPrintablesL5cMockApi(page: Page) {
  await page.route("**/api/akademi/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, "");

    if (route.request().method() !== "GET") return route.fallback();

    if (/^\/akademi\/students\/\d+\/report$/.test(path)) {
      return json(route, { report: { ...REPORT, period: { ...REPORT.period, id: Number(url.searchParams.get("period_id")) } } });
    }
    if (path === "/akademi/rank-promotions/1/participants/1/certificate") return json(route, { certificate: CERTIFICATE });
    if (/^\/akademi\/rank-promotions\/\d+\/participants\/\d+\/certificate$/.test(path)) {
      return json(route, { message: "Sertifikat hanya tersedia untuk peserta yang lulus." }, 422);
    }

    return route.fallback();
  });
}
