import { SppBill } from "../../_lib/admin-api";

export type SppBillSummary = {
  bill: number;
  paid: number;
  paidCount: number;
  partialCount: number;
  waivedCount: number;
  unpaidCount: number;
};

export const SPP_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const sppStatusLabels: Record<SppBill["status"], string> = {
  unpaid: "Belum lunas",
  partial: "Sebagian",
  paid: "Lunas",
  waived: "Dibebaskan",
};

export function summarizeBills(bills: SppBill[]): SppBillSummary {
  return bills.reduce<SppBillSummary>(
    (total, item) => ({
      bill: total.bill + Number(item.amount),
      paid: total.paid + Number(item.paid_amount),
      paidCount: total.paidCount + (item.status === "paid" ? 1 : 0),
      partialCount: total.partialCount + (item.status === "partial" ? 1 : 0),
      waivedCount: total.waivedCount + (item.status === "waived" ? 1 : 0),
      unpaidCount: total.unpaidCount + (item.status === "unpaid" || item.status === "partial" ? 1 : 0),
    }),
    { bill: 0, paid: 0, paidCount: 0, partialCount: 0, waivedCount: 0, unpaidCount: 0 },
  );
}

export function remainingAmount(bill: SppBill) {
  if (bill.status === "waived") return 0;
  return Math.max(Number(bill.amount) - Number(bill.paid_amount), 0);
}

export function billsForClass(bills: SppBill[], classId: number) {
  return bills.filter((item) => item.class_id === classId || item.student?.primary_class_id === classId);
}

export function isBillOpen(bill: SppBill) {
  return bill.status !== "paid" && bill.status !== "waived";
}
