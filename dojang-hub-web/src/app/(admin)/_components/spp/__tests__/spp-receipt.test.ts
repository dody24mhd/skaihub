import { describe, expect, it } from "vitest";
import { SppReceipt } from "../../../_lib/admin-api";
import { normalizeWhatsappPhone, receiptPeriodLabel, receiptWhatsappText, receiptWhatsappUrl } from "../spp-receipt";

function receipt(overrides: Partial<SppReceipt> = {}): SppReceipt {
  return {
    id: 5,
    receipt_number: "KW-202610-0001",
    akademi: { name: "Dojang Garuda", logo_url: null },
    student: {
      id: 1,
      name: "Arya Pratama",
      member_number: "TKD-0001",
      student_phone: "081234567891",
      guardian_name: "Budi Santoso",
      guardian_phone: "0812-0000-0000",
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
    ...overrides,
  };
}

describe("spp-receipt", () => {
  it("menormalkan nomor HP Indonesia ke format wa.me", () => {
    expect(normalizeWhatsappPhone("0812-0000-0000")).toBe("6281200000000");
    expect(normalizeWhatsappPhone("+62 812 0000 0000")).toBe("6281200000000");
    expect(normalizeWhatsappPhone("81200000000")).toBe("6281200000000");
    expect(normalizeWhatsappPhone("12345")).toBeNull();
    expect(normalizeWhatsappPhone(null)).toBeNull();
  });

  it("menampilkan periode dengan nama bulan lengkap", () => {
    expect(receiptPeriodLabel(2026, 10)).toBe("Oktober 2026");
  });

  it("ringkasan teks berisi nomor kwitansi, siswa, periode, jumlah, dan sisa", () => {
    const text = receiptWhatsappText(receipt());

    expect(text).toContain("KW-202610-0001");
    expect(text).toContain("Arya Pratama");
    expect(text).toContain("Oktober 2026");
    expect(text).toMatch(/Rp\s?50\.000/);
    expect(text).toMatch(/Sisa tagihan: Rp\s?100\.000/);
    expect(text).toContain("Transfer");
  });

  it("link WhatsApp memakai nomor wali, lalu nomor siswa, dan null bila tidak ada nomor", () => {
    expect(receiptWhatsappUrl(receipt())).toMatch(/^https:\/\/wa\.me\/6281200000000\?text=/);

    const studentOnly = receipt({ student: { ...receipt().student, guardian_phone: null } });
    expect(receiptWhatsappUrl(studentOnly)).toMatch(/^https:\/\/wa\.me\/6281234567891\?text=/);

    const noPhone = receipt({ student: { ...receipt().student, guardian_phone: null, student_phone: null } });
    expect(receiptWhatsappUrl(noPhone)).toBeNull();
  });
});
