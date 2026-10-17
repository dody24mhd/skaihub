import { SppReceipt } from "../../_lib/admin-api";
import { money } from "../students/format";

const INDONESIA_COUNTRY_CODE = "62";
const MIN_PHONE_DIGITS = 9;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
};

export function paymentMethodLabel(method: string | null): string {
  if (!method) return "-";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function normalizeWhatsappPhone(raw: string | null | undefined): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < MIN_PHONE_DIGITS) return null;
  if (digits.startsWith(INDONESIA_COUNTRY_CODE)) return digits;
  if (digits.startsWith("0")) return `${INDONESIA_COUNTRY_CODE}${digits.slice(1)}`;
  return `${INDONESIA_COUNTRY_CODE}${digits}`;
}

export function receiptPeriodLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export function receiptDateLabel(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

export function receiptWhatsappText(receipt: SppReceipt): string {
  return [
    `Kwitansi SPP ${receipt.akademi.name}`,
    `No. kwitansi: ${receipt.receipt_number || "-"}`,
    `Siswa: ${receipt.student.name}`,
    `Periode: ${receiptPeriodLabel(receipt.billing_year, receipt.billing_month)}`,
    `Dibayar: ${money(receipt.amount)} (${paymentMethodLabel(receipt.method)}) pada ${receiptDateLabel(receipt.paid_at)}`,
    `Sisa tagihan: ${money(receipt.remaining_amount)}`,
    "Terima kasih.",
  ].join("\n");
}

export function receiptWhatsappUrl(receipt: SppReceipt): string | null {
  const phone = normalizeWhatsappPhone(receipt.student.guardian_phone) ?? normalizeWhatsappPhone(receipt.student.student_phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(receiptWhatsappText(receipt))}`;
}
