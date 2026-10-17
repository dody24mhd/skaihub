import { render, screen, fireEvent } from "@testing-library/react";
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
  { id: 1, akademi_id: 1, sport_type: "taekwondo" as const, code: "white", label: "Putih", sequence: 1 },
  { id: 2, akademi_id: 1, sport_type: "taekwondo" as const, code: "yellow", label: "Kuning", sequence: 2 },
];

const builtinRank = {
  id: 10,
  akademi_id: null,
  sport_type: "taekwondo",
  rank_system: "taekwondo_kukkiwon",
  code: "tkd-geup-8",
  label: "Geup 8 (Kuning Strip Hijau)",
  sequence: 30,
  level_type: "geup" as const,
  level_number: 8,
  belt_color: "yellow",
  stripe_color: "green",
};

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
    // 1 table, 1 card, 1 tombol warna & 1 opsi warna strip di form aside
    expect(await screen.findAllByText("Putih")).toHaveLength(4);
    expect(await screen.findAllByText("Kuning")).toHaveLength(4);
  });

  it("membuka SheetModal saat tombol Tambah Tingkatan diklik di mobile", async () => {
    render(<AcademyRanksManager />);

    const addBtn = await screen.findByRole("button", { name: /\+ Tambah Tingkatan/i });
    fireEvent.click(addBtn);

    // Dialog terbuka dengan heading
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tambah Tingkatan/i })).toBeInTheDocument();
  });

  it("di desktop (xl) tombol Edit mengisi form samping tanpa membuka SheetModal", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    try {
      render(<AcademyRanksManager />);

      // Tombol Edit kini punya aria-label "Edit <nama>" agar bisa dibedakan pembaca layar.
      const [editBtn] = await screen.findAllByRole("button", { name: "Edit Putih" });
      fireEvent.click(editBtn);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Putih" })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("menandai sabuk bawaan sebagai terkunci dengan label sistem", async () => {
    vi.mocked(adminApi.getAkademiSportRanks).mockResolvedValue({
      data: [builtinRank, ...mockRanks],
    });

    render(<AcademyRanksManager />);

    expect(await screen.findAllByText("Bawaan Kukkiwon")).toHaveLength(2);
    expect(screen.getByText(/Sistem Taekwondo Kukkiwon/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Geup 8 (Kuning Strip Hijau)" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit Putih" }).length).toBeGreaterThan(0);
    expect(
      document.querySelector('[aria-label="Geup 8 (Kuning Strip Hijau)"] [data-stripe-color="green"]')
    ).not.toBeNull();
  });
});
