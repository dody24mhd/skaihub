"use client";

import { FormEvent } from "react";
import { FormField, SheetModal } from "../ui";

export type EvaluationPeriodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  periodName: string;
  setPeriodName: (val: string) => void;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
  isSaving: boolean;
  onCreatePeriod: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function EvaluationPeriodModal({
  isOpen,
  onClose,
  periodName,
  setPeriodName,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  isSaving,
  onCreatePeriod,
}: EvaluationPeriodModalProps) {
  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Periode Penilaian Baru"
      description="Buat periode penilaian raport siswa."
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          await onCreatePeriod(e);
          onClose();
        }}
      >
        <FormField
          id="period-name-modal"
          label="Nama Periode"
          value={periodName}
          onChange={(e) => setPeriodName(e.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="period-start-modal"
            label="Mulai"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
          <FormField
            id="period-end-modal"
            label="Selesai"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
        <p className="rounded-md bg-surface-container-low p-3 text-xs font-semibold text-muted">
          Periode baru dibuat sebagai Draft.
        </p>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
          disabled={isSaving}
          type="submit"
        >
          Buat Periode
        </button>
      </form>
    </SheetModal>
  );
}
