import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyDashboardManager from "../academy-dashboard-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return {
    ...actual,
    getAkademiDashboardSummary: vi.fn(),
  };
});

const mockSummary: adminApi.AkademiDashboardSummary = {
  profile: {
    user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi", akademi_id: 1, is_active: true, avatar_url: null },
    akademi: { id: 1, name: "Taekwondo Nusantara", slug: "taekwondo-nusantara", sport_type: "taekwondo", logo_url: null, status: "active", plan: "pro", plan_expires_at: null, created_at: "", updated_at: "" },
    subscription: null,
    entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
  },
  period: { year: 2026, month: 10, month_label: "Oktober 2026" },
  students: { active_count: 42, inactive_count: 3, alumni_count: 5, latest: [] },
  setup: { places_count: 2, classes_count: 4, active_schedules_count: 6 },
  spp: { bill_count: 10, total_amount: 1500000, paid_amount: 1200000, unpaid_count: 2 },
  sessions: {
    month_count: 12,
    completed_count: 10,
    attendance_total: 100,
    attendance_present: 90,
    attendance_rate: 90,
    latest: [
      {
        id: 7,
        akademi_id: 1,
        training_schedule_id: null,
        class_id: 1,
        training_place_id: 1,
        coach_id: 1,
        session_date: "2026-10-17",
        source_schedule_date: null,
        starts_at: "16:00:00",
        ends_at: "18:00:00",
        material: "Poomsae",
        notes: null,
        photo_urls: [],
        session_type: "regular",
        status: "completed",
        class: {
          id: 1,
          akademi_id: 1,
          name: "Reguler Sore",
          training_place_id: null,
          spp_amount_override: null,
          target_sessions_per_month: 8,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        coach: {
          id: 1,
          name: "Sabeum Budi",
          email: "budi@test.com",
          role: "pelatih",
          avatar_url: null,
          is_active: true,
          akademi_id: 1,
          akademi: null,
        },
      },
    ],
  },
  evaluation: { active_period: null, active_scores_count: 0 },
  rank_promotion: { latest_event: null },
};

describe("AcademyDashboardManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiDashboardSummary).mockResolvedValue(mockSummary);
  });

  it("menampilkan ringkasan profil akademi dan kartu kuota siswa", async () => {
    render(<AcademyDashboardManager />);

    expect(await screen.findByText("Taekwondo Nusantara")).toBeInTheDocument();
    expect(screen.getAllByText("42").length).toBeGreaterThanOrEqual(1);
  });

  it("menampilkan kartu sesi latihan terbaru dengan tautan ke absensi", async () => {
    render(<AcademyDashboardManager />);

    expect(await screen.findByText("Reguler Sore")).toBeInTheDocument();
    expect(screen.getByText(/sabeum budi/i)).toBeInTheDocument();
    const sessionLink = screen.getByRole("link", { name: /buka absensi/i });
    expect(sessionLink).toHaveAttribute("href", "/academy/attendance/new?session=7");
  });
});
