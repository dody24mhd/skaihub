import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import RankCertificateView from "../rank-certificate-view";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiRankCertificate: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const certificate: api.RankCertificate = {
  certificate_number: "UKT/2026/0001/0004",
  akademi: { name: "Dojang Garuda", logo_url: null, sport_type: "taekwondo" },
  student: { id: 7, name: "Arya Pratama", member_number: "TKD-0007" },
  event: { id: 1, name: "UKT Oktober 2026", event_date: "2026-10-20" },
  from_rank: { id: 2, code: "tkd-geup-9", label: "Geup 9 (Kuning)", belt_color: "yellow", stripe_color: null },
  to_rank: { id: 3, code: "tkd-geup-8", label: "Geup 8 (Kuning strip hijau)", belt_color: "yellow", stripe_color: "green" },
  score: 88,
  assessor: "Sabeum Budi",
  chair_name: "Ketua Garuda",
};

describe("RankCertificateView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
  });

  it("menampilkan sertifikat kelulusan dengan sabuk baru dan penanda tangan", async () => {
    mockedApi.getAkademiRankCertificate.mockResolvedValue({ certificate });
    render(<RankCertificateView eventId={1} participantId={4} />);

    const article = await screen.findByRole("article", { name: /Sertifikat UKT Arya Pratama/ });
    const text = (article.textContent || "").replace(/\s/g, " ");
    expect(text).toContain("UKT/2026/0001/0004");
    expect(text).toContain("Dojang Garuda");
    expect(text).toContain("Geup 8 (Kuning strip hijau)");
    expect(text).toContain("Geup 9 (Kuning)");
    expect(text).toContain("UKT Oktober 2026");
    expect(text).toContain("20 Oktober 2026");
    expect(text).toContain("88");
    expect(text).toContain("Sabeum Budi");
    expect(text).toContain("Ketua Garuda");
    expect(mockedApi.getAkademiRankCertificate).toHaveBeenCalledWith("token-uji", 1, 4);
  });

  it("tombol cetak memanggil dialog cetak browser", async () => {
    mockedApi.getAkademiRankCertificate.mockResolvedValue({ certificate });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<RankCertificateView eventId={1} participantId={4} />);

    fireEvent.click(await screen.findByRole("button", { name: "Cetak / Simpan PDF" }));

    expect(print).toHaveBeenCalled();
  });

  it("menampilkan pesan server bila peserta belum lulus", async () => {
    mockedApi.getAkademiRankCertificate.mockRejectedValue(new Error("Sertifikat hanya tersedia untuk peserta yang lulus."));
    render(<RankCertificateView eventId={1} participantId={4} />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Sertifikat hanya tersedia untuk peserta yang lulus.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cetak / Simpan PDF" })).not.toBeInTheDocument();
  });
});
