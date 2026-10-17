import { Page, Route } from "@playwright/test";

export const MOCK_AKADEMI = {
  id: 1,
  name: "Taekwondo Nusantara",
  slug: "taekwondo-nusantara",
  sport_type: "taekwondo",
  logo_url: null,
  status: "active" as const,
  plan: "pro" as const,
  plan_expires_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const MOCK_USER = {
  id: 1,
  name: "Ketua Dojang",
  email: "ketua@dojang.test",
  role: "ketua_akademi" as const,
  avatar_url: null,
  is_active: true,
  akademi_id: 1,
};

export const MOCK_ME_RESPONSE = {
  user: MOCK_USER,
  akademi: MOCK_AKADEMI,
  subscription: {
    id: 1,
    akademi_id: 1,
    plan: "pro" as const,
    duration: "yearly" as const,
    status: "active" as const,
    payment_status: "paid" as const,
    starts_at: "2026-01-01",
    ends_at: "2027-01-01",
    included_student_limit: 100,
    extra_student_blocks: 0,
  },
  entitlements: {
    student_limit: 100,
    has_public_website: true,
    has_subdomain: true,
    has_rapor: true,
    has_exam_events: true,
    has_parent_portal: false,
  },
};

export const MOCK_STUDENTS = [
  {
    id: 1,
    akademi_id: 1,
    name: "Arya Pratama",
    email: "arya@example.com",
    phone: "081234567891",
    birth_date: "2010-05-12",
    gender: "male",
    status: "active",
    rank: { id: 1, name: "Kuning (Geup 8)", color: "yellow" },
    training_class: { id: 1, name: "Reguler Sore" },
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Dewi Lestari",
    email: "dewi@example.com",
    phone: "081234567892",
    birth_date: "2011-08-20",
    gender: "female",
    status: "active",
    rank: { id: 2, name: "Hijau (Geup 6)", color: "green" },
    training_class: { id: 1, name: "Reguler Sore" },
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: 3,
    akademi_id: 1,
    name: "Bima Satria",
    email: "bima@example.com",
    phone: "081234567893",
    birth_date: "2009-02-14",
    gender: "male",
    status: "active",
    rank: { id: 3, name: "Biru (Geup 4)", color: "blue" },
    training_class: { id: 2, name: "Prestasi Malam" },
    created_at: "2026-01-03T00:00:00Z",
  },
];

export const MOCK_CLASSES = [
  {
    id: 1,
    akademi_id: 1,
    name: "Reguler Sore",
    description: "Kelas pembinaan dasar sabuk putih - hijau",
    is_active: true,
    students_count: 2,
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Prestasi Malam",
    description: "Kelas persiapan turnamen kyorugi dan poomsae",
    is_active: true,
    students_count: 1,
  },
];

export const MOCK_TRAINING_PLACES = [
  {
    id: 1,
    akademi_id: 1,
    name: "Dojang Utama",
    address: "Jl. Sudirman No. 1",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_SCHEDULE_COACHES = [
  {
    id: 1,
    akademi_id: 1,
    name: "Sabeum Nim",
    email: "coach@example.com",
    role: "pelatih" as const,
    is_active: true,
    avatar_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_TRAINING_SCHEDULES = [
  {
    id: 1,
    akademi_id: 1,
    class_id: 1,
    training_place_id: 1,
    coach_id: 1,
    day_of_week: 1,
    starts_at: "16:00:00",
    ends_at: "18:00:00",
    is_active: true,
    notes: "Latihan reguler sore",
    class: MOCK_CLASSES[0],
    training_place: MOCK_TRAINING_PLACES[0],
    coach: MOCK_SCHEDULE_COACHES[0],
    coaches: [MOCK_SCHEDULE_COACHES[0]],
  },
];

export const MOCK_TRAINING_SESSIONS = [
  {
    id: 1,
    akademi_id: 1,
    training_schedule_id: 1,
    class_id: 1,
    training_place_id: 1,
    coach_id: 1,
    session_date: "2026-10-17",
    source_schedule_date: null,
    starts_at: "16:00:00",
    ends_at: "18:00:00",
    material: "Poomsae Taegeuk 1",
    notes: null,
    photo_urls: null,
    session_type: "regular" as const,
    status: "completed" as const,
    attendances_count: 2,
    present_count: 1,
    class: {
      id: 1,
      akademi_id: 1,
      training_place_id: 1,
      name: "Reguler Sore",
      description: "Kelas reguler",
      age_category: null,
      max_students: 20,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    coach: {
      id: 1,
      name: "Sabeum Nim",
      email: "coach@example.com",
      phone: "08123456789",
    },
    coaches: [
      {
        id: 1,
        name: "Sabeum Nim",
        email: "coach@example.com",
        phone: "08123456789",
      },
    ],
    training_place: {
      id: 1,
      name: "Dojang Utama",
      address: "Jl. Sudirman No. 1",
      is_active: true,
    },
    attendances: [
      { id: 1, student_id: 1, participant_name: "Arya Pratama", is_extra_participant: false, status: "present", student: MOCK_STUDENTS[0] },
      { id: 2, student_id: 2, participant_name: "Dewi Lestari", is_extra_participant: false, status: "absent", student: MOCK_STUDENTS[1] },
    ],
  },
];

export const MOCK_SPP_BILLS = [
  {
    id: 1,
    akademi_id: 1,
    student_id: 1,
    month: 10,
    year: 2026,
    billing_month: 10,
    billing_year: 2026,
    amount: "150000",
    paid_amount: "0",
    status: "unpaid" as const,
    due_date: "2026-10-10",
    student: MOCK_STUDENTS[0],
    class: MOCK_CLASSES[0],
  },
  {
    id: 2,
    akademi_id: 1,
    student_id: 2,
    month: 10,
    year: 2026,
    billing_month: 10,
    billing_year: 2026,
    amount: "150000",
    paid_amount: "150000",
    status: "paid" as const,
    paid_at: "2026-10-05",
    due_date: "2026-10-10",
    student: MOCK_STUDENTS[1],
    class: MOCK_CLASSES[0],
  },
];

// L3-D mock data
export const MOCK_SPORT_RANKS = [
  { id: 1, akademi_id: 1, sport_type: "taekwondo", code: "white", label: "Putih", sequence: 1 },
  { id: 2, akademi_id: 1, sport_type: "taekwondo", code: "yellow", label: "Kuning", sequence: 2 },
  { id: 3, akademi_id: 1, sport_type: "taekwondo", code: "green", label: "Hijau", sequence: 3 },
];

export const MOCK_EVALUATION_PERIODS = [
  {
    id: 1,
    akademi_id: 1,
    name: "Semester Ganjil 2026/2027",
    starts_at: "2026-07-01",
    ends_at: "2026-12-31",
    status: "active" as const,
    aspects_count: 2,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
];

export const MOCK_EVALUATION_ASPECTS = [
  {
    id: 1,
    akademi_id: 1,
    evaluation_period_id: 1,
    name: "Kicking (Tae)",
    category: "Teknik",
    sort_order: 1,
    is_active: true,
    description: null,
  },
  {
    id: 2,
    akademi_id: 1,
    evaluation_period_id: 1,
    name: "Poomsae",
    category: "Teknik",
    sort_order: 2,
    is_active: true,
    description: null,
  },
];

export const MOCK_RANK_PROMOTION_EVENTS = [
  {
    id: 1,
    akademi_id: 1,
    name: "UKT Geup Periode Oktober 2026",
    event_date: "2026-10-25",
    status: "draft" as const,
    notes: null,
    created_by: 1,
    participants_count: 1,
    passed_count: 1,
    participants: [
      {
        id: 1,
        rank_promotion_event_id: 1,
        akademi_id: 1,
        student_id: 1,
        from_rank_id: 1,
        to_rank_id: 2,
        result: "passed" as const,
        score: 85,
        notes: "Lulus memuaskan",
        assessed_by: null,
        student: MOCK_STUDENTS[0],
        from_rank: MOCK_SPORT_RANKS[0],
        to_rank: MOCK_SPORT_RANKS[1],
      },
    ],
  },
];

export const MOCK_DASHBOARD_SUMMARY = {
  profile: MOCK_ME_RESPONSE,
  period: {
    year: 2026,
    month: 10,
    month_label: "Oktober 2026",
  },
  students: {
    active_count: 3,
    inactive_count: 0,
    alumni_count: 0,
    latest: MOCK_STUDENTS,
  },
  setup: {
    places_count: 1,
    classes_count: 2,
    active_schedules_count: 2,
  },
  spp: {
    bill_count: 2,
    total_amount: 300000,
    paid_amount: 150000,
    unpaid_count: 1,
  },
  sessions: {
    month_count: 1,
    completed_count: 1,
    attendance_total: 2,
    attendance_present: 1,
    attendance_rate: 50,
    latest: MOCK_TRAINING_SESSIONS,
  },
  evaluation: {
    active_period: null,
    active_scores_count: 0,
  },
};

// --- L3-E Setup & Public Profile Fixtures ---
export const MOCK_PLACES = [
  {
    id: 1,
    akademi_id: 1,
    name: "Dojang Utama Bulungan",
    address: "Jl. Kyai Maja No. 2, Kebayoran Baru",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Dojang Cabang Senayan",
    address: "Jl. Asia Afrika No. 8, Senayan",
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

export const MOCK_COACHES = [
  {
    id: 1,
    akademi_id: 1,
    name: "Sabeum Nim Budi Hartono",
    email: "budi.coach@dojang.test",
    role: "pelatih" as const,
    is_active: true,
    photo_url: null,
    show_on_public: true,
    coach_profile: {
      id: 1,
      user_id: 1,
      phone: "081298765432",
      rank_label: "Dan 4 Kukkiwon",
      license_number: "LIC-2024-KUK-012",
      joined_date: "2022-03-01T00:00:00Z",
      address: "Jakarta Selatan",
    },
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Sabeum Agnes Monica",
    email: "agnes.coach@dojang.test",
    role: "pelatih" as const,
    is_active: true,
    photo_url: null,
    show_on_public: false,
    coach_profile: {
      id: 2,
      user_id: 2,
      phone: "081298765433",
      rank_label: "Dan 2 Kukkiwon",
      license_number: "LIC-2025-PBTI-088",
      joined_date: "2023-07-15T00:00:00Z",
      address: "Jakarta Barat",
    },
  },
];

export const MOCK_USERS = [
  {
    id: 1,
    akademi_id: 1,
    name: "Ketua Dojang",
    email: "ketua@dojang.test",
    role: "ketua_akademi" as const,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    coach_profile: null,
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Pengurus Administrasi",
    email: "admin@dojang.test",
    role: "admin_akademi" as const,
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
    coach_profile: null,
  },
  {
    id: 3,
    akademi_id: 1,
    name: "Sabeum Nim Budi Hartono",
    email: "budi.coach@dojang.test",
    role: "pelatih" as const,
    is_active: true,
    created_at: "2026-01-03T00:00:00Z",
    coach_profile: { id: 1 },
  },
];

export const MOCK_PUBLIC_PROFILE = {
  id: 1,
  akademi_id: 1,
  about: "Pusat pembinaan atlet beladiri Taekwondo berprestasi tinggi.",
  vision: "Menjadi dojang taekwondo terdepan dalam prestasi dan karakter atlet.",
  mission: "Menyelenggarakan latihan terstruktur dengan instruktur bersertifikasi internasional.",
  public_schedule: null,
  whatsapp: "81234567890",
  cta_label: "Hubungi via WhatsApp",
  is_published: true,
  primary_color: "#031636",
  button_color: "#d32f2f",
  background_color: "#f8fafc",
  text_color: "#0f172a",
  heading_font: "Montserrat",
  body_font: "Inter",
  button_radius: 8,
  hero_images: [
    {
      id: 1,
      image_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800",
      caption: "Latihan Poomsae & Kyorugi",
      focal_x: 50,
      focal_y: 50,
      pan_x: 0,
      pan_y: 0,
      zoom: 100,
      sort_order: 0,
      is_active: true,
    },
  ],
  gallery_items: [
    {
      id: 1,
      image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600",
      caption: "UKT Periode Genap 2026",
      show_on_about: true,
      sort_order: 0,
    },
  ],
  achievements: [
    {
      id: 1,
      title: "Juara Umum Kejurda DKI Jakarta 2025",
      description: "Meraih 8 medali emas dan 4 medali perak",
      achieved_on: "2025-11-20",
      sort_order: 0,
    },
  ],
  officials: [
    {
      id: 1,
      name: "Master Hendra Wijaya",
      position: "Ketua Dewan Pembina",
      photo_url: null,
      description: "Dan 7 Kukkiwon",
      sort_order: 0,
      is_active: true,
    },
  ],
};

export async function setupMockApi(page: Page) {
  // Tangkap semua request ke API (baik localhost:8000 maupun URL kustom)
  await page.route("**/api/**", async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "PATCH" && url.includes("/attendance")) {
      const postData = (route.request().postDataJSON() || {}) as {
        status?: string;
        material?: string;
        attendances?: Array<{ id: number; status: string }>;
      };
      const updatedSession = {
        ...MOCK_TRAINING_SESSIONS[0],
        status: postData.status || "completed",
        material: postData.material || MOCK_TRAINING_SESSIONS[0].material,
        attendances: (MOCK_TRAINING_SESSIONS[0].attendances || []).map((att) => {
          const edit = (postData.attendances || []).find((e) => e.id === att.id);
          return edit ? { ...att, status: edit.status } : att;
        }),
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Berhasil", training_session: updatedSession }),
      });
    }

    if (method === "POST" && url.includes("/akademi/training-sessions")) {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Berita acara dibuat",
          training_session: MOCK_TRAINING_SESSIONS[0],
        }),
      });
    }

    if (method !== "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Berhasil", data: {} }),
      });
    }

    if (url.includes("/akademi/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ME_RESPONSE),
      });
    }

    if (url.includes("/akademi/dashboard/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DASHBOARD_SUMMARY),
      });
    }

    if (url.includes("/akademi/students")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            data: MOCK_STUDENTS,
            current_page: 1,
            last_page: 1,
            total: MOCK_STUDENTS.length,
          },
        }),
      });
    }

    if (url.includes("/akademi/training-places")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_PLACES }),
      });
    }

    if (url.includes("/akademi/classes")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_CLASSES }),
      });
    }

    if (url.includes("/akademi/coaches")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_COACHES }),
      });
    }

    if (url.includes("/akademi/training-places")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_TRAINING_PLACES }),
      });
    }

    if (url.includes("/akademi/training-schedules")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_TRAINING_SCHEDULES }),
      });
    }

    if (url.match(/\/akademi\/training-sessions\/\d+/)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ training_session: MOCK_TRAINING_SESSIONS[0] }),
      });
    }

    if (url.includes("/akademi/users")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_USERS }),
      });
    }

    if (url.includes("/akademi/public-profile")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: MOCK_PUBLIC_PROFILE,
          coaches: MOCK_COACHES,
        }),
      });
    }

    if (url.includes("/akademi/training-sessions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            data: MOCK_TRAINING_SESSIONS,
            total: MOCK_TRAINING_SESSIONS.length,
            current_page: 1,
            last_page: 1,
            per_page: 200,
          },
        }),
      });
    }

    if (url.includes("/akademi/spp-bills")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            data: MOCK_SPP_BILLS,
            current_page: 1,
            last_page: 1,
            total: MOCK_SPP_BILLS.length,
          },
        }),
      });
    }

    // L3-D routes
    if (url.match(/\/akademi\/evaluations\/periods\/\d+\/scores/)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }

    if (url.match(/\/akademi\/evaluations\/periods\/\d+\/aspects/)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_EVALUATION_ASPECTS }),
      });
    }

    if (url.includes("/akademi/evaluations/periods")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_EVALUATION_PERIODS }),
      });
    }

    if (url.includes("/akademi/sport-ranks")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_SPORT_RANKS }),
      });
    }

    if (url.match(/\/akademi\/rank-promotions\/\d+/)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rank_promotion_event: MOCK_RANK_PROMOTION_EVENTS[0] }),
      });
    }

    if (url.includes("/akademi/rank-promotions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_RANK_PROMOTION_EVENTS }),
      });
    }

    // Fallback data kosong untuk rute akademi lainnya
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

