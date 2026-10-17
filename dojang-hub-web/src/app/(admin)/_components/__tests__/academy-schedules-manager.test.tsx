import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademySchedulesManager from "../academy-schedules-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return {
    ...actual,
    getAkademiMe: vi.fn(),
    getAkademiTrainingSchedules: vi.fn(),
    getAkademiClasses: vi.fn(),
    getAkademiTrainingPlaces: vi.fn(),
    getAkademiCoaches: vi.fn(),
    createAkademiTrainingSchedule: vi.fn(),
    updateAkademiTrainingSchedule: vi.fn(),
    deleteAkademiTrainingSchedule: vi.fn(),
  };
});

const mockMe: adminApi.AkademiMeResponse = {
  user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi", akademi_id: 1, is_active: true, avatar_url: null },
  akademi: { id: 1, name: "Dojang Hebat", slug: "dojang-hebat", sport_type: "taekwondo", logo_url: null, status: "active", plan: "pro", plan_expires_at: null, created_at: "", updated_at: "" },
  subscription: null,
  entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
};

const mockPlaces: { data: adminApi.TrainingPlace[] } = {
  data: [
    {
      id: 1,
      akademi_id: 1,
      name: "Dojang Utama",
      address: null,
      notes: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
};

const mockClasses: { data: adminApi.TrainingClass[] } = {
  data: [
    {
      id: 1,
      akademi_id: 1,
      name: "Kelas Sore",
      training_place_id: 1,
      spp_amount_override: null,
      target_sessions_per_month: 8,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
};

const mockCoaches: { data: adminApi.Coach[] } = {
  data: [
    {
      id: 1,
      akademi_id: 1,
      name: "Sabeum Budi",
      email: "budi@test.com",
      role: "pelatih",
      avatar_url: null,
      is_active: true,
      akademi: null,
    },
  ],
};

const mockSchedules: { data: adminApi.TrainingSchedule[] } = {
  data: [
    {
      id: 5,
      akademi_id: 1,
      class_id: 1,
      training_place_id: 1,
      coach_id: 1,
      day_of_week: 1, // Senin
      starts_at: "16:00:00",
      ends_at: "18:00:00",
      is_active: true,
      notes: "Bawa pelindung",
      created_at: "",
      updated_at: "",
      class: mockClasses.data[0],
      training_place: mockPlaces.data[0],
      coach: mockCoaches.data[0],
    },
  ],
};

describe("AcademySchedulesManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiTrainingSchedules).mockResolvedValue(mockSchedules);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue(mockClasses);
    vi.mocked(adminApi.getAkademiTrainingPlaces).mockResolvedValue(mockPlaces);
    vi.mocked(adminApi.getAkademiCoaches).mockResolvedValue(mockCoaches);
  });

  it("merender daftar jadwal latihan dengan ResponsiveList", async () => {
    render(<AcademySchedulesManager />);

    expect(await screen.findByText("Jadwal Latihan Reguler")).toBeInTheDocument();
    expect(screen.getAllByText("Senin").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Kelas Sore").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("16:00 - 18:00").length).toBeGreaterThanOrEqual(1);
  });

  it("membuka modal form saat tombol Tambah Jadwal diklik", async () => {
    render(<AcademySchedulesManager />);

    expect(await screen.findByText("Jadwal Latihan Reguler")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /\+ tambah jadwal/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Jadwal Reguler Baru")).toBeInTheDocument();
  });
});
