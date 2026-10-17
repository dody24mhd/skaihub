import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyUsersManager from "../academy-users-manager";
import * as adminApi from "../../_lib/admin-api";
import type { AcademyManagedUser, AkademiMeResponse } from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiUsers: vi.fn(),
  createAkademiUser: vi.fn(),
  updateAkademiUser: vi.fn(),
  deleteAkademiUser: vi.fn(),
}));

describe("AcademyUsersManager", () => {
  const mockMe: AkademiMeResponse = {
    user: {
      id: 1,
      name: "Ketua Dojang",
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

  const mockUsers: AcademyManagedUser[] = [
    {
      id: 1,
      akademi_id: 1,
      name: "Ketua Dojang",
      email: "ketua@test.com",
      role: "ketua_akademi",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      coach_profile: null,
    },
    {
      id: 2,
      akademi_id: 1,
      name: "Admin Staff",
      email: "staff@test.com",
      role: "admin_akademi",
      is_active: true,
      created_at: "2026-01-02T00:00:00Z",
      coach_profile: null,
    },
    {
      id: 3,
      akademi_id: 1,
      name: "Pelatih Joko",
      email: "joko@test.com",
      role: "pelatih",
      is_active: false,
      created_at: "2026-01-03T00:00:00Z",
      coach_profile: { id: 1 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiUsers).mockResolvedValue({ data: mockUsers });
  });

  it("merender daftar akun dan mendukung filter role", async () => {
    render(<AcademyUsersManager />);

    expect(screen.getByText("Memuat akun akademi...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Ketua Dojang").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Admin Staff").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pelatih Joko").length).toBeGreaterThan(0);
    });

    const roleSelect = screen.getByLabelText(/filter role/i);
    fireEvent.change(roleSelect, { target: { value: "pelatih" } });

    expect(screen.getAllByText("Pelatih Joko").length).toBeGreaterThan(0);
    expect(screen.queryByText("Admin Staff")).not.toBeInTheDocument();
  });

  it("membuka modal tambah akun baru", async () => {
    render(<AcademyUsersManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tambah akun/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah akun/i }));

    expect(screen.getByRole("heading", { name: "Tambah Akun" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveValue("");
    expect(screen.getByLabelText(/email login/i)).toHaveValue("");
  });

  it("membuka modal edit akun terisi", async () => {
    render(<AcademyUsersManager />);

    await waitFor(() => {
      expect(screen.getAllByText("Admin Staff").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[1]);

    expect(screen.getByRole("heading", { name: "Edit Akun" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveValue("Admin Staff");
    expect(screen.getByLabelText(/email login/i)).toHaveValue("staff@test.com");
  });
});
