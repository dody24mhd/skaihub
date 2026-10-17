import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyUsersManager from "../academy-users-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiUsers: vi.fn(),
  createAkademiUser: vi.fn(),
  updateAkademiUser: vi.fn(),
  deleteAkademiUser: vi.fn(),
}));

describe("AcademyUsersManager", () => {
  const mockMe = {
    user: { id: 1, name: "Ketua Dojang", email: "ketua@test.com", role: "ketua_akademi" },
    akademi: { id: 1, name: "Test Dojang" },
  };

  const mockUsers = [
    {
      id: 1,
      akademi_id: 1,
      name: "Ketua Dojang",
      email: "ketua@test.com",
      role: "ketua_akademi",
      is_active: true,
      coach_profile: null,
    },
    {
      id: 2,
      akademi_id: 1,
      name: "Admin Staff",
      email: "staff@test.com",
      role: "admin_akademi",
      is_active: true,
      coach_profile: null,
    },
    {
      id: 3,
      akademi_id: 1,
      name: "Pelatih Joko",
      email: "joko@test.com",
      role: "pelatih",
      is_active: false,
      coach_profile: { id: 1 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe as any);
    vi.mocked(adminApi.getAkademiUsers).mockResolvedValue({ data: mockUsers } as any);
  });

  it("merender daftar akun dan mendukung filter role", async () => {
    render(<AcademyUsersManager />);

    expect(screen.getByText("Memuat akun akademi...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Ketua Dojang").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Admin Staff").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pelatih Joko").length).toBeGreaterThan(0);
    });

    // Test filter role pelatih
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
    // edit button for Admin Staff (index 1)
    fireEvent.click(editButtons[1]);

    expect(screen.getByRole("heading", { name: "Edit Akun" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveValue("Admin Staff");
    expect(screen.getByLabelText(/email login/i)).toHaveValue("staff@test.com");
  });
});
