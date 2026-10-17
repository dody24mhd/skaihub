import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

const mockSchedules = {
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
      class: { id: 1, name: "Kelas Sore" },
      training_place: { id: 1, name: "Dojang Utama" },
      coach: { id: 1, name: "Sabeum Budi" },
    },
  ],
};

const mockClasses = { data: [{ id: 1, name: "Kelas Sore", is_active: true }] };
const mockPlaces = { data: [{ id: 1, name: "Dojang Utama", is_active: true }] };
const mockCoaches = { data: [{ id: 1, name: "Sabeum Budi", is_active: true }] };

describe("AcademySchedulesManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiTrainingSchedules).mockResolvedValue(mockSchedules as any);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue(mockClasses as any);
    vi.mocked(adminApi.getAkademiTrainingPlaces).mockResolvedValue(mockPlaces as any);
    vi.mocked(adminApi.getAkademiCoaches).mockResolvedValue(mockCoaches as any);
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
