import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppReceiptView from "../spp-receipt-view";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiSppReceipt: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const receipt: api.SppReceipt = {
  id: 5,
  receipt_number: "KW-202610-0001",
  akademi: { name: "Dojang Garuda", logo_url: null },
  student: {
    id: 1,
    name: "Arya Pratama",
    member_number: "TKD-0001",
    student_phone: null,
    guardian_name: "Budi Santoso",
    guardian_phone: "081200000000",
  },
  class_name: "Reguler Sore",
  billing_year: 2026,
  billing_month: 10,
  amount: "50000.00",
  bill_amount: "150000.00",
  remaining_amount: "100000.00",
  method: "transfer",
  paid_at: "2026-10-05",
  received_by: "Admin Garuda",
  notes: null,
};

describe("SppReceiptView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
  });

  it("menampilkan kwitansi lengkap dan link WhatsApp ke nomor wali", async () => {
    mockedApi.getAkademiSppReceipt.mockResolvedValue({ receipt });
    render(<SppReceiptView paymentId={5} />);

    const article = await screen.findByRole("article", { name: /Kwitansi SPP/ });
    const text = (article.textContent || "").replace(/\s/g, " ");
    expect(text).toContain("KW-202610-0001");
    expect(text).toContain("Dojang Garuda");
    expect(text).toContain("Arya Pratama");
    expect(text).toContain("Budi Santoso");
    expect(text).toContain("Oktober 2026");
    expect(text).toContain("Rp 50.000");
    expect(text).toContain("Rp 100.000");
    expect(text).toContain("Transfer");
    expect(text).toContain("Admin Garuda");
    expect(mockedApi.getAkademiSppReceipt).toHaveBeenCalledWith("token-uji", 5);

    const whatsapp = screen.getByRole("link", { name: /Bagikan via WhatsApp/ });
    expect(whatsapp.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/6281200000000\?text=/);
    expect(whatsapp).toHaveAttribute("target", "_blank");
  });

  it("tombol cetak memanggil dialog cetak browser", async () => {
    mockedApi.getAkademiSppReceipt.mockResolvedValue({ receipt });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<SppReceiptView paymentId={5} />);

    fireEvent.click(await screen.findByRole("button", { name: /Cetak/ }));

    expect(print).toHaveBeenCalled();
  });

  it("tanpa nomor telepon tidak ada tombol WhatsApp", async () => {
    mockedApi.getAkademiSppReceipt.mockResolvedValue({
      receipt: { ...receipt, student: { ...receipt.student, guardian_phone: null, student_phone: null } },
    });
    render(<SppReceiptView paymentId={5} />);

    await screen.findByRole("article", { name: /Kwitansi SPP/ });
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Nomor wali belum diisi/)).toBeInTheDocument();
  });

  it("menampilkan error dan bisa mencoba lagi", async () => {
    mockedApi.getAkademiSppReceipt.mockRejectedValueOnce(new Error("Kwitansi tidak ditemukan.")).mockResolvedValueOnce({ receipt });
    render(<SppReceiptView paymentId={5} />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Kwitansi tidak ditemukan.")).toBeInTheDocument();
    fireEvent.click(within(alert).getByRole("button", { name: /coba lagi/i }));

    expect(await screen.findByRole("article", { name: /Kwitansi SPP/ })).toBeInTheDocument();
  });
});
