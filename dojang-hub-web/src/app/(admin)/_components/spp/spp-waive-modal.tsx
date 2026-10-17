"use client";

import { FormEvent, useState } from "react";
import { SppBill, waiveAkademiSppBill } from "../../_lib/admin-api";
import { money } from "../students/format";
import { FormField, SheetModal } from "../ui";
import { remainingAmount } from "./spp-summary";

const controlClass =
  "min-h-20 w-full border bg-white px-3.5 py-2.5 text-base text-primary outline-none transition focus:ring-2 sm:text-sm";

type SppWaiveModalProps = {
  token: string;
  bill: SppBill;
  onClose: () => void;
  onWaived: (bill: SppBill) => Promise<void> | void;
};

export default function SppWaiveModal({ token, bill, onClose, onWaived }: SppWaiveModalProps) {
  const isReasonRequired = Number(bill.paid_amount) > 0;
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (isReasonRequired && !trimmed) {
      setReasonError("Alasan wajib diisi karena tagihan ini sudah dibayar sebagian.");
      return;
    }

    setReasonError("");
    setError("");
    setIsSaving(true);
    try {
      const result = await waiveAkademiSppBill(token, bill.id, null, trimmed || null);
      await onWaived(result.spp_bill);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membebaskan tagihan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SheetModal
      isOpen
      onClose={onClose}
      title="Bebaskan Tagihan"
      description={`Sisa ${money(remainingAmount(bill))} tidak akan ditagih lagi.`}
    >
      <p className="font-heading text-lg font-bold text-primary">{bill.student?.name || "Siswa"}</p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField
          id="spp-waive-reason"
          label="Alasan"
          required={isReasonRequired}
          error={reasonError}
          hint={isReasonRequired ? "Wajib: tagihan ini sudah dibayar sebagian." : "Opsional. Tercatat di riwayat tagihan."}
        >
          <textarea
            id="spp-waive-reason"
            aria-invalid={Boolean(reasonError)}
            className={`${controlClass} ${reasonError ? "border-secondary focus:ring-secondary" : "border-border-strong focus:border-primary focus:ring-primary"}`}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
        {error ? <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 flex-1 bg-secondary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
            {isSaving ? "Memproses..." : "Bebaskan Tagihan"}
          </button>
          <button className="min-h-11 border border-border px-4 text-sm font-bold text-primary" onClick={onClose} type="button">Batal</button>
        </div>
      </form>
    </SheetModal>
  );
}
