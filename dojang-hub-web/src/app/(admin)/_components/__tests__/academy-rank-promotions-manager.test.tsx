import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AcademyRankPromotionsManager from "../academy-rank-promotions-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiRankPromotionEvents: vi.fn(),
  getAkademiRankPromotionEvent: vi.fn(),
  getAkademiStudents: vi.fn(),
  getAkademiSportRanks: vi.fn(),
  createAkademiRankPromotionEvent: vi.fn(),
  addAkademiRankPromotionParticipant: vi.fn(),
  updateAkademiRankPromotionEvent: vi.fn(),
  updateAkademiRankPromotionParticipant: vi.fn(),
}));

const mockEvent = {
  id: 1,
  akademi_id: 1,
  name: "UKT Periode 1",
  event_date: "2026-10-20",
  status: "draft" as const,
  notes: null,
  created_by: 1,
  participants_count: 1,
  participants: [
    {
      id: 1,
      rank_promotion_event_id: 1,
      akademi_id: 1,
      assessed_by: null,
      student_id: 1,
      from_rank_id: 1,
      to_rank_id: 2,
      score: 85,
      result: "passed" as const,
      notes: "Gerakan bagus",
      student: {
        id: 1,
        name: "Bima Arya",
        member_number: "TKD-101",
      },
      from_rank: { id: 1, label: "Putih", code: "white" },
      to_rank: { id: 2, label: "Kuning", code: "yellow" },
    },
  ],
};

describe("AcademyRankPromotionsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "test-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue({
      user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi" as const, is_active: true, akademi_id: 1, avatar_url: null },
      akademi: { id: 1, name: "Dojang", slug: "dojang", sport_type: "taekwondo", logo_url: null, status: "active" as const, plan: "pro" as const, plan_expires_at: null, created_at: "", updated_at: "" },
      subscription: null,
      entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
    });
    vi.mocked(adminApi.getAkademiRankPromotionEvents).mockResolvedValue({
      data: [mockEvent as unknown as adminApi.RankPromotionEvent],
    });
    vi.mocked(adminApi.getAkademiRankPromotionEvent).mockResolvedValue({
      rank_promotion_event: mockEvent as unknown as adminApi.RankPromotionEvent,
    });
    vi.mocked(adminApi.getAkademiStudents).mockResolvedValue({
      data: { data: [], current_page: 1, last_page: 1, total: 0 },
    });
    vi.mocked(adminApi.getAkademiSportRanks).mockResolvedValue({
      data: [],
    });
  });

  it("merender peserta UKT dengan ResponsiveList dan aksi kelulusan", async () => {
    render(<AcademyRankPromotionsManager />);

    expect(await screen.findByText("Peserta Kenaikan Tingkat")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Lulus$/i })).toHaveLength(2); // tombol aksi Lulus (1 di tabel, 1 di kartu)
  });

  it("membuka modal tambah peserta saat tombol diklik di mobile", async () => {
    render(<AcademyRankPromotionsManager />);

    const addBtn = await screen.findByRole("button", { name: /\+ Tambah Peserta/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tambah Peserta UKT/i })).toBeInTheDocument();
  });
});
