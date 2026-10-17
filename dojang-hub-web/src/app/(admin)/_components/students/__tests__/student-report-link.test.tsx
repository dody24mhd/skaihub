import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import StudentReportLink from "../student-report-link";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiEvaluationPeriods: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const period = (id: number, name: string, status: api.EvaluationPeriod["status"]): api.EvaluationPeriod => ({
  id,
  akademi_id: 1,
  name,
  starts_at: "2026-01-01",
  ends_at: "2026-06-30",
  status,
  notes: null,
});

describe("StudentReportLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("memilih periode aktif secara default dan menautkan halaman rapor", async () => {
    mockedApi.getAkademiEvaluationPeriods.mockResolvedValue({
      data: [period(3, "Semester 2", "closed"), period(5, "Semester 3", "active")],
    });
    render(<StudentReportLink token="token-uji" studentId={7} />);

    const link = await screen.findByRole("link", { name: /Cetak Rapor/ });
    expect(link).toHaveAttribute("href", "/academy/students/7/report?period_id=5");

    fireEvent.change(screen.getByLabelText("Periode rapor"), { target: { value: "3" } });
    expect(link).toHaveAttribute("href", "/academy/students/7/report?period_id=3");
  });

  it("tanpa periode menampilkan keterangan", async () => {
    mockedApi.getAkademiEvaluationPeriods.mockResolvedValue({ data: [] });
    render(<StudentReportLink token="token-uji" studentId={7} />);

    expect(await screen.findByText(/Belum ada periode evaluasi/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Cetak Rapor/ })).not.toBeInTheDocument();
  });

  it("menampilkan error dan bisa mencoba lagi", async () => {
    mockedApi.getAkademiEvaluationPeriods
      .mockRejectedValueOnce(new Error("Gagal memuat periode."))
      .mockResolvedValueOnce({ data: [period(5, "Semester 3", "active")] });
    render(<StudentReportLink token="token-uji" studentId={7} />);

    fireEvent.click(await screen.findByRole("button", { name: /Coba lagi/ }));

    expect(await screen.findByRole("link", { name: /Cetak Rapor/ })).toBeInTheDocument();
  });
});
