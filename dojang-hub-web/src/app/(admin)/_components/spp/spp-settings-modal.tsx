"use client";

import { FormEvent, useState } from "react";
import { SppSettings, updateAkademiSppSettings } from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";

const MIN_DUE_DAY = 1;
const MAX_DUE_DAY = 28;

type SppSettingsModalProps = {
  token: string;
  settings: SppSettings;
  onClose: () => void;
  onSaved: (settings: SppSettings) => void;
};

export default function SppSettingsModal({ token, settings, onClose, onSaved }: SppSettingsModalProps) {
  const [amount, setAmount] = useState(settings.default_monthly_amount ? String(Number(settings.default_monthly_amount)) : "");
  const [dueDay, setDueDay] = useState(String(settings.due_day));
  const [dueDayError, setDueDayError] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const day = Number(dueDay);
    if (!Number.isInteger(day) || day < MIN_DUE_DAY || day > MAX_DUE_DAY) {
      setDueDayError(`Tanggal jatuh tempo harus antara ${MIN_DUE_DAY} dan ${MAX_DUE_DAY}.`);
      return;
    }

    setDueDayError("");
    setError("");
    setIsSaving(true);
    try {
      const result = await updateAkademiSppSettings(token, {
        default_monthly_amount: amount === "" ? null : Number(amount),
        due_day: day,
      });
      onSaved(result.spp_settings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan pengaturan SPP.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SheetModal isOpen onClose={onClose} title="Pengaturan SPP" description="Nominal cadangan dan tanggal jatuh tempo tagihan bulanan.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <FormField
          id="spp-settings-amount"
          label="Nominal SPP default"
          type="number"
          inputMode="numeric"
          min="0"
          value={amount}
          hint="Dipakai bila kelas siswa belum punya nominal SPP khusus. Kosongkan bila tidak ada."
          onChange={(event) => setAmount(event.target.value)}
        />
        <FormField
          id="spp-settings-due-day"
          label="Tanggal jatuh tempo"
          type="number"
          inputMode="numeric"
          min={MIN_DUE_DAY}
          max={MAX_DUE_DAY}
          required
          value={dueDay}
          error={dueDayError}
          hint={`Tanggal ${MIN_DUE_DAY}-${MAX_DUE_DAY} setiap bulan. Lewat tanggal ini tagihan ditandai Terlambat.`}
          onChange={(event) => setDueDay(event.target.value)}
        />
        {error ? <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 flex-1 bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
          <button className="min-h-11 border border-border px-4 text-sm font-bold text-primary" onClick={onClose} type="button">Batal</button>
        </div>
      </form>
    </SheetModal>
  );
}
