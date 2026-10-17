"use client";

import { FormEvent, useState } from "react";
import { EvaluationPeriod } from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";
import { shortDate } from "./evaluation-types";

export type EvaluationCopyAspectsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  periods: EvaluationPeriod[];
  targetPeriod: EvaluationPeriod;
  isSaving: boolean;
  onCopy: (source: EvaluationPeriod) => Promise<boolean>;
};

export function copySourceCandidates(periods: EvaluationPeriod[], target: EvaluationPeriod): EvaluationPeriod[] {
  return periods
    .filter((period) => period.id !== target.id && (period.aspects_count ?? 0) > 0)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
}

export function defaultCopySource(periods: EvaluationPeriod[], target: EvaluationPeriod): EvaluationPeriod | null {
  const candidates = copySourceCandidates(periods, target);

  return candidates.find((period) => period.starts_at <= target.starts_at) ?? candidates[0] ?? null;
}

export default function EvaluationCopyAspectsModal(props: EvaluationCopyAspectsModalProps) {
  return (
    <SheetModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Salin Variabel Penilaian"
      description={`Salin variabel dari periode lain ke ${props.targetPeriod.name}.`}
    >
      {props.isOpen ? <CopyAspectsForm key={props.targetPeriod.id} {...props} /> : null}
    </SheetModal>
  );
}

function CopyAspectsForm({ onClose, periods, targetPeriod, isSaving, onCopy }: EvaluationCopyAspectsModalProps) {
  const candidates = copySourceCandidates(periods, targetPeriod);
  const [sourceId, setSourceId] = useState(() => String(defaultCopySource(periods, targetPeriod)?.id ?? ""));
  const source = candidates.find((period) => String(period.id) === sourceId) ?? null;

  if (!candidates.length) {
    return (
      <p className="border-2 border-dashed border-border bg-white p-6 text-center text-sm font-medium text-muted">
        Belum ada periode lain yang punya variabel untuk disalin.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source) return;

    const isCopied = await onCopy(source);
    if (isCopied) onClose();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField id="copy-aspects-source" label="Periode sumber" required>
        <select
          id="copy-aspects-source"
          className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary sm:text-sm"
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
          required
        >
          {candidates.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} ({shortDate(period.starts_at)})
            </option>
          ))}
        </select>
      </FormField>
      {source ? (
        <p className="bg-surface-container-low p-3 text-xs font-semibold text-muted">
          {source.aspects_count ?? 0} variabel akan disalin. Variabel dengan nama yang sudah ada di periode ini dilewati.
        </p>
      ) : null}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
        disabled={isSaving || !source}
        type="submit"
      >
        {isSaving ? "Menyalin..." : "Salin Variabel"}
      </button>
    </form>
  );
}
