import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyAttendanceOverviewManager from "../academy-attendance-overview-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return {
    ...actual,
    getAkademiTrainingSessions: vi.fn(),
    getAkademiClasses: vi.fn(),
  };
});

const mockSessions = {
  data: {
    data: [
      {
        id: 10,
        akademi_id: 1,
        training_schedule_id: 1,
        class_id: 1,
        training_place_id: 1,
        coach_id: 1,
        session_date: "2026-10-17",
        source_schedule_date: null,
        starts_at: "16:00:00",
        ends_at: "18:00:00",
        material: "Kyorugi Dasar",
        notes: null,
        photo_urls: [],
        session_type: "regular" as const,
        status: "completed" as const,
        attendances_count: 5,
        present_count: 4,
        class: {
          id: 1,
          akademi_id: 1,
          name: "Kelas Sore",
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
          role: "pelatih" as const,
          avatar_url: null,
          is_active: true,
          akademi_id: 1,
          akademi: null,
        },
      },
    ],
    current_page: 1,
    last_page: 1,
    total: 1,
  },
};

const mockClasses: { data: adminApi.TrainingClass[] } = {
  data: [
    {
      id: 1,
      akademi_id: 1,
      name: "Kelas Sore",
      training_place_id: null,
      spp_amount_override: null,
      target_sessions_per_month: 8,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
};

describe("AcademyAttendanceOverviewManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiTrainingSessions).mockResolvedValue(mockSessions);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue(mockClasses);
  });

  it("merender kalender absensi aktual dan filter pencarian", async () => {
    render(<AcademyAttendanceOverviewManager />);

    expect(await screen.findByText("Kalender Absensi Aktual")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cari absensi")).toBeInTheDocument();
  });

  it("menampilkan data sesi dalam daftar riwayat dan kartu mobile", async () => {
    render(<AcademyAttendanceOverviewManager />);

    expect(await screen.findAllByText("Kelas Sore")).not.toHaveLength(0);
    expect(screen.getAllByText("4/5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /lanjutkan/i }).length).toBeGreaterThanOrEqual(1);
  });
});
