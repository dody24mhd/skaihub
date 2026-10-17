import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import StudentRankHistorySection from "../student-rank-history-section";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiStudentRankHistories: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function history(overrides: Partial<api.StudentRankHistory>): api.StudentRankHistory {
  return {
    id: 1,
    akademi_id: 1,
    student_id: 5,
    sport_rank_id: 2,
    achieved_on: "2026-09-14T00:00:00.000000Z",
    source_type: "manual",
    rank_promotion_participant_id: null,
    notes: null,
    changed_by: { id: 3, name: "Admin Dojang" },
    sport_rank: { id: 2, sport_type: "taekwondo", code: "yellow", label: "Kuning (Geup 8)", sequence: 2 },
    promotion_participant: null,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
    ...overrides,
  };
}

describe("StudentRankHistorySection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memuat riwayat sabuk siswa dan membedakan sumber manual dan UKT", async () => {
    mockedApi.getAkademiStudentRankHistories.mockResolvedValue({
      data: [
        history({
          id: 2,
          source_type: "promotion_event",
          sport_rank: { id: 3, sport_type: "taekwondo", code: "green", label: "Hijau (Geup 6)", sequence: 3 },
          promotion_participant: { event: { name: "UKT Semester 2" } } as api.StudentRankHistory["promotion_participant"],
        }),
        history({ id: 1, notes: "Pindahan dojang lain" }),
      ],
    });

    render(<StudentRankHistorySection token="token-uji" studentId={5} />);

    const items = await screen.findAllByRole("listitem");
    expect(mockedApi.getAkademiStudentRankHistories).toHaveBeenCalledWith("token-uji", 5);
    expect(within(items[0]).getByText("Hijau (Geup 6)")).toBeInTheDocument();
    expect(within(items[0]).getByText(/UKT Semester 2/)).toBeInTheDocument();
    expect(within(items[1]).getByText(/Perubahan manual oleh Admin Dojang/)).toBeInTheDocument();
    expect(within(items[1]).getByText("Pindahan dojang lain")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tambah/i })).not.toBeInTheDocument();
  });

  it("menampilkan empty state", async () => {
    mockedApi.getAkademiStudentRankHistories.mockResolvedValue({ data: [] });
    render(<StudentRankHistorySection token="token-uji" studentId={5} />);

    expect(await screen.findByText("Belum ada riwayat sabuk.")).toBeInTheDocument();
  });

  it("menampilkan error dengan tombol coba lagi", async () => {
    mockedApi.getAkademiStudentRankHistories
      .mockRejectedValueOnce(new Error("Gagal jaringan."))
      .mockResolvedValueOnce({ data: [] });
    render(<StudentRankHistorySection token="token-uji" studentId={5} />);

    expect(await screen.findByText("Gagal jaringan.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    expect(await screen.findByText("Belum ada riwayat sabuk.")).toBeInTheDocument();
  });
});
