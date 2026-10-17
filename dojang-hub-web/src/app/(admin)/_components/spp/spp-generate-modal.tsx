"use client";

import { FormEvent, useState } from "react";
import { SppSettings, TrainingClass, generateAkademiSppBills } from "../../_lib/admin-api";
import { money } from "../students/format";
import { FormField, SheetModal } from "../ui";
import {
  SppGenerateForm,
  SppGenerateSummary,
  generatePayloadFromForm,
  initialGenerateForm,
  needsDefaultAmount,
  summarizeGenerateResult,
} from "./spp-generate";
import { SPP_MONTH_LABELS } from "./spp-summary";

const controlClass =
  "min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm";

function GenerateResult({ summary, onClose }: { summary: SppGenerateSummary; onClose: () => void }) {
  const rows = [
    { label: "Dibuat", value: summary.created, tone: "text-success" },
    { label: "Dilewati karena sudah ada", value: summary.alreadyExists, tone: "text-primary" },
    { label: "Dilewati karena nominal kosong", value: summary.missingAmount, tone: "text-secondary" },
  ];

  return (
    <div className="space-y-4">
      <dl data-testid="spp-generate-result" className="divide-y divide-border border border-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 p-3 text-sm">
            <dt className="font-semibold text-muted">{row.label}</dt>
            <dd className={`font-heading text-xl font-black ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {summary.missingAmount ? (
        <p className="text-sm text-muted">Isi nominal default atau atur nominal SPP kelas, lalu buat ulang untuk siswa yang dilewati.</p>
      ) : null}
      <button className="min-h-11 w-full bg-primary px-4 text-sm font-bold text-white" onClick={onClose} type="button">Selesai</button>
    </div>
  );
}

function amountHint(isAmountRequired: boolean, academyDefault: string | null) {
  if (isAmountRequired) return "Wajib: ada kelas tanpa nominal SPP khusus. Nominal ini dipakai untuk siswa di kelas tersebut.";
  if (academyDefault) return `Opsional: kosongkan untuk memakai nominal default akademi ${money(academyDefault)}.`;
  return "Opsional: dipakai hanya untuk siswa yang kelasnya belum punya nominal SPP khusus.";
}

export default function SppGenerateModal({
  token,
  classes,
  settings = null,
  onClose,
  onGenerated,
}: {
  token: string;
  classes: TrainingClass[];
  settings?: SppSettings | null;
  onClose: () => void;
  onGenerated: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<SppGenerateForm>(() => initialGenerateForm(new Date()));
  const [summary, setSummary] = useState<SppGenerateSummary | null>(null);
  const [amountError, setAmountError] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const academyDefault = settings?.default_monthly_amount ?? null;
  const isAmountRequired = needsDefaultAmount(classes, form.class_id, academyDefault);
  const dueHint = settings ? `Opsional. Kosongkan untuk memakai tanggal ${settings.due_day} bulan tagihan.` : "Opsional.";

  function setField(key: keyof SppGenerateForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isAmountRequired && !form.default_amount) {
      setAmountError("Nominal default wajib diisi karena ada kelas tanpa nominal SPP.");
      return;
    }

    setAmountError("");
    setError("");
    setIsSaving(true);

    try {
      const result = await generateAkademiSppBills(token, generatePayloadFromForm(form));
      setSummary(summarizeGenerateResult(result));
      await onGenerated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuat tagihan SPP.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SheetModal isOpen onClose={onClose} title="Buat Tagihan SPP" description="Buat tagihan bulanan untuk semua siswa aktif.">
      {summary ? (
        <GenerateResult summary={summary} onClose={onClose} />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="spp-generate-month" label="Bulan">
              <select id="spp-generate-month" className={controlClass} value={form.billing_month} onChange={(event) => setField("billing_month", event.target.value)}>
                {SPP_MONTH_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
              </select>
            </FormField>
            <FormField id="spp-generate-year" label="Tahun" type="number" inputMode="numeric" min="2020" max="2100" required value={form.billing_year} onChange={(event) => setField("billing_year", event.target.value)} />
          </div>
          <FormField id="spp-generate-class" label="Kelas">
            <select id="spp-generate-class" className={controlClass} value={form.class_id} onChange={(event) => setField("class_id", event.target.value)}>
              <option value="">Semua kelas</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </FormField>
          <FormField
            id="spp-generate-amount"
            label="Nominal default"
            type="number"
            inputMode="numeric"
            min="0"
            required={isAmountRequired}
            value={form.default_amount}
            error={amountError}
            hint={amountHint(isAmountRequired, academyDefault)}
            onChange={(event) => setField("default_amount", event.target.value)}
          />
          <FormField id="spp-generate-due" label="Jatuh tempo" type="date" hint={dueHint} value={form.due_date} onChange={(event) => setField("due_date", event.target.value)} />
          {error ? <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="min-h-11 flex-1 bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
              {isSaving ? "Memproses..." : "Buat Tagihan"}
            </button>
            <button className="min-h-11 border border-border px-4 text-sm font-bold text-primary" onClick={onClose} type="button">Batal</button>
          </div>
        </form>
      )}
    </SheetModal>
  );
}
