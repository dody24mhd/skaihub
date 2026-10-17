import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import StudentReportView from "../student-report-view";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiStudentReport: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const report: api.StudentReport = {
  akademi: { name: "Dojang Garuda", logo_url: null, sport_type: "taekwondo" },
  student: {
    id: 7,
    name: "Arya Pratama",
    member_number: "TKD-0007",
    gender: "male",
    birth_date: "2014-03-02",
    joined_date: "2025-01-10",
    photo_url: null,
    class_name: "Junior A",
    training_place: "GOR Garuda",
    rank: { id: 3, code: "tkd-geup-8", label: "Geup 8 (Kuning strip hijau)", belt_color: "yellow", stripe_color: "green" },
  },
  period: { id: 2, name: "Semester 1 2026", starts_at: "2026-07-01", ends_at: "2026-12-31", status: "active" },
  attendance: { total: 5, present: 2, sick: 1, excused: 1, absent: 1, rate: 40 },
  scores: [
    { aspect_id: 1, aspect: "Poomsae", category: "Teknik", score: 70, indicator: "cukup", notes: null },
    { aspect_id: 2, aspect: "Tendangan", category: "Teknik", score: 95, indicator: "sangat_baik", notes: "Tendangan sangat kuat." },
    { aspect_id: 3, aspect: "Sikap", category: "Karakter", score: null, indicator: null, notes: null },
  ],
  average: 82.5,
  average_indicator: "baik",
  assessors: ["Sabeum Budi"],
  generated_at: "2026-10-17",
};

describe("StudentReportView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
  });

  it("menampilkan identitas, kehadiran, nilai, predikat, dan catatan pelatih", async () => {
    mockedApi.getAkademiStudentReport.mockResolvedValue({ report });
    render(<StudentReportView studentId={7} periodId={2} />);

    const article = await screen.findByRole("article", { name: /Rapor Arya Pratama/ });
    const text = (article.textContent || "").replace(/\s/g, " ");
    expect(text).toContain("Dojang Garuda");
    expect(text).toContain("Semester 1 2026");
    expect(text).toContain("TKD-0007");
    expect(text).toContain("Junior A");
    expect(text).toContain("Geup 8 (Kuning strip hijau)");
    expect(text).toContain("40%");
    expect(text).toContain("Tendangan sangat kuat.");
    expect(text).toContain("Sabeum Budi");
    expect(mockedApi.getAkademiStudentReport).toHaveBeenCalledWith("token-uji", 7, 2);

    const table = within(article).getByRole("table", { name: /Nilai per aspek/ });
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent(/Poomsae.*70.*Cukup/);
    expect(rows[2]).toHaveTextContent(/Tendangan.*95.*Sangat Baik/);
    expect(rows[3]).toHaveTextContent(/Sikap.*-/);
    expect(within(article).getByTestId("report-average")).toHaveTextContent("82,5");
    expect(within(article).getByTestId("report-average")).toHaveTextContent("Baik");
  });

  it("tombol cetak memanggil dialog cetak browser", async () => {
    mockedApi.getAkademiStudentReport.mockResolvedValue({ report });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<StudentReportView studentId={7} periodId={2} />);

    fireEvent.click(await screen.findByRole("button", { name: "Cetak / Simpan PDF" }));

    expect(print).toHaveBeenCalled();
  });

  it("menampilkan keterangan bila belum ada nilai", async () => {
    mockedApi.getAkademiStudentReport.mockResolvedValue({
      report: { ...report, scores: [], average: null, average_indicator: null },
    });
    render(<StudentReportView studentId={7} periodId={2} />);

    expect(await screen.findByText(/Belum ada nilai pada periode ini/)).toBeInTheDocument();
  });

  it("tanpa periode meminta pengguna memilih periode", () => {
    render(<StudentReportView studentId={7} periodId={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Pilih periode evaluasi/);
    expect(mockedApi.getAkademiStudentReport).not.toHaveBeenCalled();
  });

  it("menampilkan error dan bisa mencoba lagi", async () => {
    mockedApi.getAkademiStudentReport.mockRejectedValueOnce(new Error("Siswa tidak ditemukan.")).mockResolvedValueOnce({ report });
    render(<StudentReportView studentId={7} periodId={2} />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Siswa tidak ditemukan.")).toBeInTheDocument();
    fireEvent.click(within(alert).getByRole("button", { name: /coba lagi/i }));

    expect(await screen.findByRole("article", { name: /Rapor Arya Pratama/ })).toBeInTheDocument();
  });
});
