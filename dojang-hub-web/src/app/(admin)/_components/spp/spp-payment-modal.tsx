"use client";

import { FormEvent, useState } from "react";
import { SppBill, payAkademiSppBill, uploadAkademiFile } from "../../_lib/admin-api";
import { money } from "../students/format";
import { FormField, SheetModal } from "../ui";
import { remainingAmount } from "./spp-summary";

const controlClass =
  "min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-base text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary sm:text-sm";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SppPaymentModal({
  token,
  bill,
  onClose,
  onPaid,
}: {
  token: string;
  bill: SppBill;
  onClose: () => void;
  onPaid: (bill: SppBill) => Promise<void> | void;
}) {
  const [amount, setAmount] = useState(String(remainingAmount(bill)));
  const [paidAt, setPaidAt] = useState(today());
  const [method, setMethod] = useState("cash");
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleProofUpload(file: File | null) {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const result = await uploadAkademiFile(token, file, "spp_proof");
      setProofUrl(result.url);
      setMessage("Bukti bayar terupload.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal upload bukti bayar.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await payAkademiSppBill(token, bill.id, {
        amount: Number(amount),
        paid_at: paidAt,
        method: method || null,
        proof_url: proofUrl || null,
        notes: notes || null,
      });
      await onPaid(result.spp_bill);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan pembayaran.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SheetModal
      isOpen
      onClose={onClose}
      title="Pembayaran"
      description={`Tagihan ${money(bill.amount)} - Terbayar ${money(bill.paid_amount)}`}
    >
      <p className="font-heading text-lg font-bold text-primary">{bill.student?.name || "Siswa"}</p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <FormField id="spp-pay-amount" label="Nominal bayar" type="number" inputMode="numeric" min="0" required value={amount} onChange={(event) => setAmount(event.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="spp-pay-date" label="Tanggal" type="date" required value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          <FormField id="spp-pay-method" label="Metode">
            <select id="spp-pay-method" className={controlClass} value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </FormField>
        </div>
        <FormField id="spp-pay-proof" label="Bukti bayar">
          <input
            id="spp-pay-proof"
            className="block min-h-11 w-full py-2 text-sm text-muted"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => handleProofUpload(event.target.files?.[0] || null)}
          />
          {proofUrl ? <a className="inline-flex text-xs font-bold text-secondary" href={proofUrl} target="_blank" rel="noreferrer">Bukti terupload</a> : null}
          {isUploading ? <span className="block text-xs text-muted">Mengupload...</span> : null}
        </FormField>
        <FormField id="spp-pay-notes" label="Catatan">
          <textarea id="spp-pay-notes" className={`${controlClass} min-h-20`} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        {message ? <p className="text-sm font-semibold text-success-strong">{message}</p> : null}
        {error ? <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 flex-1 bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving || isUploading} type="submit">
            {isSaving ? "Menyimpan..." : "Simpan Pembayaran"}
          </button>
          <button className="min-h-11 border border-border px-4 text-sm font-bold text-primary" onClick={onClose} type="button">Batal</button>
        </div>
      </form>
    </SheetModal>
  );
}
