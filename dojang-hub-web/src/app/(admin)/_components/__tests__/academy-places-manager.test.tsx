import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyPlacesManager from "../academy-places-manager";
import * as adminApi from "../../_lib/admin-api";
import type { AkademiMeResponse, TrainingPlace } from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiTrainingPlaces: vi.fn(),
  createAkademiTrainingPlace: vi.fn(),
  updateAkademiTrainingPlace: vi.fn(),
  deleteAkademiTrainingPlace: vi.fn(),
}));

describe("AcademyPlacesManager", () => {
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

  const mockPlaces: TrainingPlace[] = [
    {
      id: 1,
      akademi_id: 1,
      name: "Dojang Pusat",
      address: "Jl. Sudirman No. 1",
      notes: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 2,
      akademi_id: 1,
      name: "Cabang Timur",
      address: "Jl. Pemuda No. 45",
      notes: null,
      is_active: false,
      created_at: "2026-01-02T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiTrainingPlaces).mockResolvedValue({ data: mockPlaces });
  });

  it("merender daftar tempat latihan dan filter pencarian", async () => {
    render(<AcademyPlacesManager />);

    expect(screen.getByText("Memuat tempat latihan...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Dojang Pusat").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Cabang Timur").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("Cari tempat atau alamat...");
    fireEvent.change(searchInput, { target: { value: "Sudirman" } });

    expect(screen.getAllByText("Dojang Pusat").length).toBeGreaterThan(0);
    expect(screen.queryByText("Cabang Timur")).not.toBeInTheDocument();
  });

  it("dapat membuka modal tambah tempat latihan", async () => {
    render(<AcademyPlacesManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tambah tempat/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah tempat/i }));

    expect(screen.getByRole("heading", { name: "Tambah Tempat Latihan" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama tempat/i)).toHaveValue("");
  });

  it("dapat membuka modal edit dengan data terisi", async () => {
    render(<AcademyPlacesManager />);

    await waitFor(() => {
      expect(screen.getAllByText("Dojang Pusat").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole("heading", { name: "Edit Tempat Latihan" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nama tempat/i)).toHaveValue("Dojang Pusat");
    expect(screen.getByLabelText(/alamat/i)).toHaveValue("Jl. Sudirman No. 1");
  });
});
