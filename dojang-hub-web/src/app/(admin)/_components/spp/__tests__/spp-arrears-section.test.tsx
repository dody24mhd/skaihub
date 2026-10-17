import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppArrearsSection from "../spp-arrears-section";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiSppArrears: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const arrear: api.SppArrear = {
  student: {
    id: 3,
    name: "Bima Satria",
    member_number: "TKD-0003",
    primary_class_id: 2,
    student_phone: null,
    guardian_name: "Ibu Sari",
    guardian_phone: "081200000000",
    primary_class: { id: 2, name: "Prestasi Malam" },
  },
  months_count: 2,
  total_remaining: "175000.00",
  oldest_due_date: "2026-08-10",
};

describe("SppArrearsSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menampilkan tunggakan per siswa: jumlah bulan, total sisa, dan kelas", async () => {
    mockedApi.getAkademiSppArrears.mockResolvedValue({ data: [arrear] });
    render(<SppArrearsSection token="t" />);

    const card = await screen.findByTestId("responsive-list-card");
    const text = (card.textContent || "").replace(/\s/g, " ");
    expect(text).toContain("Bima Satria");
    expect(text).toContain("2 bulan");
    expect(text).toContain("Rp 175.000");
    expect(text).toContain("Prestasi Malam");
    expect(mockedApi.getAkademiSppArrears).toHaveBeenCalledWith("t");
  });

  it("menampilkan empty state bila tidak ada tunggakan", async () => {
    mockedApi.getAkademiSppArrears.mockResolvedValue({ data: [] });
    render(<SppArrearsSection token="t" />);

    expect(await screen.findByText(/Tidak ada tunggakan/)).toBeInTheDocument();
  });

  it("menampilkan error dan bisa mencoba lagi", async () => {
    mockedApi.getAkademiSppArrears.mockRejectedValueOnce(new Error("Server sibuk.")).mockResolvedValueOnce({ data: [arrear] });
    render(<SppArrearsSection token="t" />);

    expect(await screen.findByText("Server sibuk.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    expect((await screen.findAllByText("Bima Satria")).length).toBeGreaterThan(0);
  });
});
