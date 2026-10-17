import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyCoachesManager from "../academy-coaches-manager";
import * as adminApi from "../../_lib/admin-api";
import type { AkademiMeResponse, Coach } from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiCoaches: vi.fn(),
  updateAkademiCoach: vi.fn(),
}));

describe("AcademyCoachesManager", () => {
  const mockMe: AkademiMeResponse = {
    user: {
      id: 1,
      name: "Ketua",
      email: "ketua@test.com",
      role: "ketua_akademi",
      avatar_url: null,
      is_active: true,
      akademi_id: 1,
    },
    akademi: {
      id: 1,
      name: "Test Dojang",
      slug: "test-dojang",
      sport_type: "taekwondo",
      logo_url: null,
      status: "active",
      plan: "pro",
      plan_expires_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    subscription: null,
    entitlements: {
      student_limit: 100,
      has_public_website: true,
      has_subdomain: true,
      has_rapor: true,
      has_exam_events: true,
      has_parent_portal: false,
    },
  };

  const mockCoaches: Coach[] = [
    {
      id: 1,
      akademi_id: 1,
      name: "Sabeum Budi",
      email: "budi@test.com",
      role: "pelatih",
      avatar_url: null,
      is_active: true,
      akademi: mockMe.akademi,
      coach_profile: {
        id: 1,
        user_id: 1,
        akademi_id: 1,
        phone: "081234567890",
        rank_label: "Dan 3 Kukkiwon",
        license_number: "LIC-123",
        photo_url: null,
        joined_date: "2024-01-15T00:00:00Z",
        address: "Jl. Merdeka 10",
        status: "active",
      },
    },
    {
      id: 2,
      akademi_id: 1,
      name: "Sabeum Agus",
      email: "agus@test.com",
      role: "pelatih",
      avatar_url: null,
      is_active: false,
      akademi: mockMe.akademi,
      coach_profile: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiCoaches).mockResolvedValue({ data: mockCoaches });
  });

  it("merender daftar pelatih dan mendukung pencarian", async () => {
    render(<AcademyCoachesManager />);

    expect(screen.getByText("Memuat pelatih...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Sabeum Budi").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Sabeum Agus").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("Cari pelatih...");
    fireEvent.change(searchInput, { target: { value: "Budi" } });

    expect(screen.getAllByText("Sabeum Budi").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sabeum Agus")).not.toBeInTheDocument();
  });

  it("membuka modal edit profil dengan data pelatih terisi", async () => {
    render(<AcademyCoachesManager />);

    await waitFor(() => {
      expect(screen.getAllByText("Sabeum Budi").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit Profil" });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole("heading", { name: "Edit Profil Pelatih" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama pelatih/i)).toHaveValue("Sabeum Budi");
    expect(screen.getByLabelText(/nomor hp/i)).toHaveValue("081234567890");
    expect(screen.getByLabelText(/tingkatan sabuk/i)).toHaveValue("Dan 3 Kukkiwon");
    expect(screen.getByLabelText(/nomor lisensi/i)).toHaveValue("LIC-123");
  });
});
