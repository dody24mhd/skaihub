import { describe, expect, it } from "vitest";
import { SppBill } from "../../../_lib/admin-api";
import { billsForClass, remainingAmount, summarizeBills } from "../spp-summary";

function bill(overrides: Partial<SppBill>): SppBill {
  return {
    id: 1,
    akademi_id: 1,
    student_id: 1,
    class_id: 1,
    billing_year: 2026,
    billing_month: 10,
    amount: "150000.00",
    paid_amount: "0.00",
    due_date: null,
    status: "unpaid",
    notes: null,
    ...overrides,
  };
}

describe("spp-summary", () => {
  it("menjumlahkan tagihan per status", () => {
    const summary = summarizeBills([
      bill({ id: 1, status: "paid", paid_amount: "150000.00" }),
      bill({ id: 2, status: "partial", paid_amount: "50000.00" }),
      bill({ id: 3, status: "unpaid" }),
      bill({ id: 4, status: "waived", amount: "0.00" }),
    ]);

    expect(summary).toEqual({ bill: 450000, paid: 200000, paidCount: 1, partialCount: 1, waivedCount: 1, unpaidCount: 2 });
  });

  it("menghitung sisa tagihan tanpa nilai negatif", () => {
    expect(remainingAmount(bill({ paid_amount: "50000.00" }))).toBe(100000);
    expect(remainingAmount(bill({ paid_amount: "200000.00" }))).toBe(0);
    expect(remainingAmount(bill({ status: "waived", paid_amount: "0.00" }))).toBe(0);
  });

  it("memfilter tagihan berdasarkan kelas tagihan atau kelas utama siswa", () => {
    const bills = [
      bill({ id: 1, class_id: 1 }),
      bill({ id: 2, class_id: null, student: { primary_class_id: 1 } as SppBill["student"] }),
      bill({ id: 3, class_id: 2 }),
    ];

    expect(billsForClass(bills, 1).map((item) => item.id)).toEqual([1, 2]);
  });
});
