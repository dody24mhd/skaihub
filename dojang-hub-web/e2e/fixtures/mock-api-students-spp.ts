import { Page, Route } from "@playwright/test";

// Fixture L3-C (siswa & SPP). Didaftarkan setelah setupMockApi agar diprioritaskan Playwright;
// request lain diteruskan ke handler umum lewat route.fallback().

const RANK_YELLOW = { id: 2, sport_type: "taekwondo", code: "yellow", label: "Kuning (Geup 8)", sequence: 2 };
const RANK_GREEN = { id: 3, sport_type: "taekwondo", code: "green", label: "Hijau (Geup 6)", sequence: 3 };

export const L3C_CLASSES = [
  {
    id: 1,
    akademi_id: 1,
    training_place_id: null,
    name: "Reguler Sore",
    spp_amount_override: "150000.00",
    target_sessions_per_month: 4,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    akademi_id: 1,
    training_place_id: null,
    name: "Prestasi Malam",
    spp_amount_override: null,
    target_sessions_per_month: 8,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function student(id: number, name: string, classIndex: number, rank: typeof RANK_YELLOW) {
  return {
    id,
    akademi_id: 1,
    current_rank_id: rank.id,
    primary_class_id: L3C_CLASSES[classIndex].id,
    member_number: `TKD-000${id}`,
    name,
    gender: "male",
    birth_date: "2010-05-12",
    joined_date: "2026-01-10",
    status: "active",
    height_cm: 150,
    weight_kg: "42.50",
    student_phone: "081234567891",
    guardian_name: "Budi Santoso",
    guardian_phone: "081200000000",
    photo_url: null,
    address: "Jl. Merdeka No. 10",
    shirt_size: "M",
    school_name: "SMP Negeri 1",
    school_grade: "8",
    health_notes: null,
    current_rank: rank,
    primary_class: L3C_CLASSES[classIndex],
  };
}

export const L3C_STUDENTS = [
  student(1, "Arya Pratama Wicaksono Putra", 0, RANK_YELLOW),
  student(2, "Dewi Lestari", 0, RANK_GREEN),
  student(3, "Bima Satria", 1, RANK_GREEN),
];

const STUDENT_DETAIL = {
  student: L3C_STUDENTS[0],
  summary: { attendance_total: 8, attendance_present: 7, spp_unpaid_count: 1, evaluation_average: 82 },
  attendances: [],
  spp_bills: [],
  evaluation_scores: [],
  rank_promotions: [],
};

const RANK_HISTORIES = [
  {
    id: 2,
    akademi_id: 1,
    student_id: 1,
    sport_rank_id: 2,
    achieved_on: "2026-06-20T00:00:00.000000Z",
    source_type: "promotion_event",
    rank_promotion_participant_id: 4,
    notes: null,
    changed_by: { id: 1, name: "Ketua Dojang" },
    sport_rank: RANK_YELLOW,
    promotion_participant: { id: 4, event: { id: 1, name: "UKT Semester 1 2026" } },
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
];

const ACHIEVEMENTS = [
  {
    id: 7,
    akademi_id: 1,
    student_id: 1,
    title: "Juara 1 Kyorugi Kadet -45 kg",
    event_name: "Kejuaraan Daerah Jawa Barat",
    achieved_on: "2026-09-14T00:00:00.000000Z",
    result_label: "Emas",
    notes: null,
    created_at: "2026-09-15T00:00:00Z",
    updated_at: "2026-09-15T00:00:00Z",
  },
];

function sppBill(id: number, studentIndex: number, status: string, paid: string) {
  const owner = L3C_STUDENTS[studentIndex];
  return {
    id,
    akademi_id: 1,
    student_id: owner.id,
    class_id: owner.primary_class_id,
    billing_year: 2026,
    billing_month: 10,
    amount: "150000.00",
    paid_amount: paid,
    due_date: "2026-10-10",
    status,
    notes: null,
    student: owner,
  };
}

const SPP_BILLS = [sppBill(1, 0, "unpaid", "0.00"), sppBill(2, 1, "partial", "50000.00"), sppBill(3, 2, "paid", "150000.00")];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

function paginated<T>(items: T[]) {
  return { data: { data: items, current_page: 1, last_page: 1, total: items.length, per_page: 25 } };
}

export async function setupStudentsSppMockApi(page: Page) {
  await page.route("**/api/akademi/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, "");
    const method = route.request().method();

    if (method === "POST" && path === "/akademi/spp-bills/generate") {
      return json(route, { message: "Tagihan SPP berhasil digenerate.", created: 2, skipped: 2, missing_amount: 1 }, 201);
    }
    if (method !== "GET") return route.fallback();

    if (path === "/akademi/students") return json(route, paginated(L3C_STUDENTS));
    if (/^\/akademi\/students\/\d+$/.test(path)) return json(route, STUDENT_DETAIL);
    if (/^\/akademi\/students\/\d+\/rank-histories$/.test(path)) return json(route, { data: RANK_HISTORIES });
    if (/^\/akademi\/students\/\d+\/achievements$/.test(path)) return json(route, { data: ACHIEVEMENTS });
    if (path === "/akademi/classes") return json(route, { data: L3C_CLASSES });
    if (path === "/akademi/sport-ranks") return json(route, { data: [RANK_YELLOW, RANK_GREEN] });
    if (path === "/akademi/spp-bills") return json(route, { data: { data: SPP_BILLS, current_page: 1, last_page: 1, total: 3, per_page: 50 } });

    return route.fallback();
  });
}
