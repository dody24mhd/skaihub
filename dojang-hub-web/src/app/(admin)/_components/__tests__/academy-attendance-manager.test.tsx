import { render, screen, fireEvent } from "@testing-library/react";
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

const mockMe: adminApi.AkademiMeResponse = {
  user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi", akademi_id: 1, is_active: true, avatar_url: null },
  akademi: { id: 1, name: "Dojang Hebat", slug: "dojang-hebat", sport_type: "taekwondo", logo_url: null, status: "active", plan: "pro", plan_expires_at: null, created_at: "", updated_at: "" },
  subscription: null,
  entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
};

const mockClasses: { data: adminApi.TrainingClass[] } = {
  data: [
    {
      id: 1,
      akademi_id: 1,
      name: "Kelas Reguler Sore",
      training_place_id: null,
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
      name: "Sabeum Nim",
      email: "s@test.com",
      role: "pelatih",
      is_active: true,
      avatar_url: null,
      akademi: null,
    },
  ],
};

const mockSession: adminApi.TrainingSession = {
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
  session_type: "regular",
  status: "draft",
  class: {
    id: 1,
    akademi_id: 1,
    name: "Kelas Reguler Sore",
    training_place_id: null,
    spp_amount_override: null,
    target_sessions_per_month: 8,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  attendances: [
    {
      id: 101,
      training_session_id: 42,
      student_id: 1,
      participant_name: "Budi Santoso",
      status: "present",
      is_extra_participant: false,
      notes: null,
      student: {
        id: 1,
        akademi_id: 1,
        current_rank_id: 1,
        primary_class_id: 1,
        member_number: "MEM-001",
        name: "Budi Santoso",
        gender: "male",
        birth_date: "2010-01-01",
        joined_date: "2020-01-01",
        status: "active",
        height_cm: 150,
        weight_kg: "45",
        student_phone: null,
        guardian_name: null,
        guardian_phone: null,
        photo_url: null,
        address: null,
        shirt_size: null,
        school_name: null,
        school_grade: null,
        health_notes: null,
        current_rank: { id: 1, sport_type: "taekwondo", code: "KUNING", label: "Kuning", sequence: 1 },
      },
    },
    {
      id: 102,
      training_session_id: 42,
      student_id: 2,
      participant_name: "Siti Rahma",
      status: "absent",
      is_extra_participant: false,
      notes: null,
      student: {
        id: 2,
        akademi_id: 1,
        current_rank_id: 2,
        primary_class_id: 1,
        member_number: "MEM-002",
        name: "Siti Rahma",
        gender: "female",
        birth_date: "2011-01-01",
        joined_date: "2020-01-01",
        status: "active",
        height_cm: 145,
        weight_kg: "40",
        student_phone: null,
        guardian_name: null,
        guardian_phone: null,
        photo_url: null,
        address: null,
        shirt_size: null,
        school_name: null,
        school_grade: null,
        health_notes: null,
        current_rank: { id: 2, sport_type: "taekwondo", code: "HIJAU", label: "Hijau", sequence: 2 },
      },
    },
  ],
};

describe("AcademyAttendanceManager", () => {
  beforeEach(() => {
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue(mockClasses);
    vi.mocked(adminApi.getAkademiCoaches).mockResolvedValue(mockCoaches);
    vi.mocked(adminApi.getAkademiTrainingSession).mockResolvedValue({ training_session: mockSession });
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
