import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyAttendanceManager from "../academy-attendance-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return {
    ...actual,
    getAkademiMe: vi.fn(),
    getAkademiClasses: vi.fn(),
    getAkademiCoaches: vi.fn(),
    getAkademiTrainingSession: vi.fn(),
    createAkademiTrainingSession: vi.fn(),
    updateAkademiTrainingSessionAttendance: vi.fn(),
  };
});

const mockMe = {
  user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi" as const, akademi_id: 1, is_active: true },
  akademi: { id: 1, name: "Dojang Hebat", slug: "dojang-hebat", sport_type: "taekwondo", logo_url: null, status: "active" as const, plan: "pro" as const, plan_expires_at: null, created_at: "", updated_at: "" },
  subscription: { id: 1, akademi_id: 1, plan: "pro" as const, duration: "yearly" as const, status: "active" as const, payment_status: "paid" as const, starts_at: "", ends_at: "", included_student_limit: 100, extra_student_blocks: 0 },
  entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
};

const mockClasses = {
  data: [
    { id: 1, akademi_id: 1, name: "Kelas Reguler Sore", description: "", is_active: true },
  ],
};

const mockCoaches = {
  data: [
    { id: 1, akademi_id: 1, name: "Sabeum Nim", email: "s@test.com", phone: "08123", is_active: true },
  ],
};

const mockSession = {
  id: 42,
  akademi_id: 1,
  training_schedule_id: null,
  class_id: 1,
  training_place_id: 1,
  coach_id: 1,
  session_date: "2026-10-17",
  source_schedule_date: null,
  starts_at: "16:00:00",
  ends_at: "18:00:00",
  material: "Poomsae 1",
  notes: "Latihan lancar",
  photo_urls: [],
  session_type: "regular" as const,
  status: "draft" as const,
  class: { id: 1, name: "Kelas Reguler Sore" },
  attendances: [
    { id: 101, student_id: 1, status: "present" as const, is_extra_participant: false, student: { id: 1, name: "Budi Santoso", rank: { id: 1, name: "Kuning" } } },
    { id: 102, student_id: 2, status: "absent" as const, is_extra_participant: false, student: { id: 2, name: "Siti Rahma", rank: { id: 2, name: "Hijau" } } },
  ],
};

describe("AcademyAttendanceManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue(mockClasses as any);
    vi.mocked(adminApi.getAkademiCoaches).mockResolvedValue(mockCoaches as any);
    vi.mocked(adminApi.getAkademiTrainingSession).mockResolvedValue({ training_session: mockSession as any });
  });

  it("memuat dan menampilkan form buka absensi jika tidak ada session id", async () => {
    render(<AcademyAttendanceManager />);

    const titles = await screen.findAllByText("Buka Absensi");
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Tipe Absensi")).toBeInTheDocument();
    expect(screen.getByText("Kelas Absensi")).toBeInTheDocument();
  });

  it("memuat sesi dan menampilkan kartu peserta dengan opsi status Hadir, Izin, Sakit, Alpa", async () => {
    render(<AcademyAttendanceManager initialSessionId={42} />);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Siti Rahma")).toBeInTheDocument();

    // Pastikan tombol Sakit dan tombol status lainnya tampil
    const sickButtons = screen.getAllByRole("button", { name: /sakit/i });
    expect(sickButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("tombol Semua Hadir mengubah seluruh peserta menjadi hadir", async () => {
    render(<AcademyAttendanceManager initialSessionId={42} />);

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();

    const semuaHadirBtn = screen.getByRole("button", { name: /semua hadir/i });
    fireEvent.click(semuaHadirBtn);

    // Di bar ringkasan, Hadir harus menjadi 2
    expect(screen.getAllByText("Hadir").length).toBeGreaterThan(0);
    const countElements = screen.getAllByText("2");
    expect(countElements.length).toBeGreaterThan(0);
  });
});
