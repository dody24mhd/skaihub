import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AcademyRanksManager from "../academy-ranks-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiSportRanks: vi.fn(),
  createAkademiSportRank: vi.fn(),
  updateAkademiSportRank: vi.fn(),
  deleteAkademiSportRank: vi.fn(),
}));

const mockRanks = [
  { id: 1, akademi_id: 1, code: "white", label: "Putih", sequence: 1 },
  { id: 2, akademi_id: 1, code: "yellow", label: "Kuning", sequence: 2 },
];

describe("AcademyRanksManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "test-token");
    vi.mocked(adminApi.getAkademiSportRanks).mockResolvedValue({
      data: mockRanks,
    });
  });

  it("merender daftar tingkatan dengan ResponsiveList", async () => {
    render(<AcademyRanksManager />);

    expect(await screen.findByText("Sabuk / Tingkatan")).toBeInTheDocument();
    expect(await screen.findAllByText("Putih")).toHaveLength(3); // 1 table, 1 card, 1 button option di form aside
    expect(await screen.findAllByText("Kuning")).toHaveLength(3);
  });

  it("membuka SheetModal saat tombol Tambah Tingkatan diklik di mobile", async () => {
    render(<AcademyRanksManager />);

    const addBtn = await screen.findByRole("button", { name: /\+ Tambah Tingkatan/i });
    fireEvent.click(addBtn);

    // Dialog terbuka dengan heading
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tambah Tingkatan/i })).toBeInTheDocument();
  });
});
