"use client";

import { FormEvent } from "react";
import { FormField } from "../ui";

export type EvaluationSettingsAsideProps = {
  isPeriodDetailOpen: boolean;
  periodName: string;
  setPeriodName: (val: string) => void;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
  aspectName: string;
  setAspectName: (val: string) => void;
  aspectCategory: string;
  setAspectCategory: (val: string) => void;
  isSaving: boolean;
  selectedPeriodId: string;
  onCreatePeriod: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onCreateAspect: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function EvaluationSettingsAside({
  isPeriodDetailOpen,
  periodName,
  setPeriodName,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  aspectName,
  setAspectName,
  aspectCategory,
  setAspectCategory,
  isSaving,
  selectedPeriodId,
  onCreatePeriod,
  onCreateAspect,
}: EvaluationSettingsAsideProps) {
  return (
    <aside className="hidden space-y-6 xl:block">
      {!isPeriodDetailOpen ? (
        <section className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Tambah</p>
          <h2 className="font-heading text-lg font-bold text-primary">Periode Penilaian</h2>
          <form className="mt-4 space-y-4" onSubmit={onCreatePeriod}>
            <FormField
              id="period-name-desktop"
              label="Nama Periode"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                id="period-start-desktop"
                label="Mulai"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
              <FormField
                id="period-end-desktop"
                label="Selesai"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
              disabled={isSaving}
              type="submit"
            >
              Buat Periode
            </button>
          </form>
        </section>
      ) : (
        <section className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Tambah</p>
          <h2 className="font-heading text-lg font-bold text-primary">Variabel Penilaian</h2>
          <form className="mt-4 space-y-4" onSubmit={onCreateAspect}>
            <FormField
              id="aspect-name-desktop"
              label="Nama Aspek"
              placeholder="Contoh: Kicking"
              value={aspectName}
              onChange={(e) => setAspectName(e.target.value)}
              required
            />
            <FormField
              id="aspect-category-desktop"
              label="Kategori"
              placeholder="Contoh: Teknik"
              value={aspectCategory}
              onChange={(e) => setAspectCategory(e.target.value)}
            />
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
              disabled={isSaving || !selectedPeriodId}
              type="submit"
            >
              Tambah Variabel
            </button>
          </form>
        </section>
      )}
    </aside>
  );
}
