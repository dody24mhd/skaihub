import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyClassesManager from "../academy-classes-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiClasses: vi.fn(),
  getAkademiTrainingPlaces: vi.fn(),
  createAkademiClass: vi.fn(),
  updateAkademiClass: vi.fn(),
  deleteAkademiClass: vi.fn(),
}));

describe("AcademyClassesManager", () => {
  const mockMe = {
    user: { id: 1, name: "Ketua", email: "ketua@test.com", role: "ketua_akademi" },
    akademi: { id: 1, name: "Test Dojang" },
  };

  const mockPlaces = [
    {
      id: 10,
      akademi_id: 1,
      name: "Dojang Pusat",
      address: "Jl. Sudirman No. 1",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];

  const mockClasses = [
    {
      id: 1,
      akademi_id: 1,
      name: "Reguler Sore",
      training_place_id: 10,
      training_place: mockPlaces[0],
      spp_amount_override: "150000",
      target_sessions_per_month: 4,
      is_active: true,
      students_count: 5,
    },
    {
      id: 2,
      akademi_id: 1,
      name: "Prestasi Malam",
      training_place_id: null,
      training_place: null,
      spp_amount_override: null,
      target_sessions_per_month: 8,
      is_active: false,
      students_count: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe as any);
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue({ data: mockClasses } as any);
    vi.mocked(adminApi.getAkademiTrainingPlaces).mockResolvedValue({ data: mockPlaces } as any);
  });

  it("merender daftar kelas dan memfilter pencarian", async () => {
    render(<AcademyClassesManager />);

    expect(screen.getByText("Memuat kelas...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Reguler Sore").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Prestasi Malam").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("Cari kelas atau tempat...");
    fireEvent.change(searchInput, { target: { value: "Prestasi" } });

    expect(screen.getAllByText("Prestasi Malam").length).toBeGreaterThan(0);
    expect(screen.queryByText("Reguler Sore")).not.toBeInTheDocument();
  });

  it("membuka modal tambah kelas dengan opsi tempat", async () => {
    render(<AcademyClassesManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tambah kelas/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah kelas/i }));

    expect(screen.getByRole("heading", { name: "Tambah Kelas" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama kelas/i)).toHaveValue("");
    expect(screen.getByLabelText(/tempat latihan/i)).toContainHTML("Dojang Pusat");
  });

  it("membuka modal edit dengan data terisi", async () => {
    render(<AcademyClassesManager />);

    await waitFor(() => {
      expect(screen.getAllByText("Reguler Sore").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole("heading", { name: "Edit Kelas" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama kelas/i)).toHaveValue("Reguler Sore");
    expect(screen.getByLabelText(/iuran spp khusus/i)).toHaveValue(150000);
  });
});
