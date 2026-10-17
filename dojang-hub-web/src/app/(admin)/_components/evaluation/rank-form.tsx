"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { BELT_COLOR_OPTIONS } from "../belt-colors";
import { FormField } from "../ui";

export type RankFormValues = {
  code: string;
  label: string;
  sequence: string;
  belt_color: string;
  stripe_color: string;
};

export const emptyRankForm: RankFormValues = {
  code: "",
  label: "",
  sequence: "1",
  belt_color: "",
  stripe_color: "",
};

type RankFormProps = {
  idPrefix: string;
  form: RankFormValues;
  setForm: Dispatch<SetStateAction<RankFormValues>>;
  isEditing: boolean;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function RankForm({
  idPrefix,
  form,
  setForm,
  isEditing,
  isSaving,
  onSubmit,
  onCancel,
}: RankFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FormField
        id={`${idPrefix}-label`}
        label="Nama tingkatan"
        placeholder="Misal: Geup 9 Strip Khusus"
        value={form.label}
        onChange={(e) => setForm((cur) => ({ ...cur, label: e.target.value }))}
        required
      />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          Warna sabuk
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {BELT_COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={form.belt_color === option.value}
              onClick={() => setForm((cur) => ({ ...cur, belt_color: option.value }))}
              className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-sm font-bold transition ${
                form.belt_color === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted hover:bg-surface-container"
              }`}
            >
              <AcademyRankBeltBadge
                rank={{ code: option.value, label: option.label, belt_color: option.value }}
                size="sm"
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-stripe`}
          className="text-xs font-bold uppercase tracking-wide text-primary"
        >
          Warna strip
        </label>
        <select
          id={`${idPrefix}-stripe`}
          className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base text-primary focus:border-primary sm:text-sm"
          value={form.stripe_color}
          onChange={(e) => setForm((cur) => ({ ...cur, stripe_color: e.target.value }))}
        >
          <option value="">Tanpa strip</option>
          {BELT_COLOR_OPTIONS.filter((option) => option.value !== "red_black").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <FormField
        id={`${idPrefix}-code`}
        label="Kode"
        placeholder="Misal: geup-9-strip"
        value={form.code}
        onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value }))}
        required
      />
      <FormField
        id={`${idPrefix}-sequence`}
        label="Urutan"
        hint="Isi di antara urutan sabuk bawaan, mis. 25 untuk di antara 20 dan 30."
        type="number"
        inputMode="numeric"
        min="1"
        max="999"
        value={form.sequence}
        onChange={(e) => setForm((cur) => ({ ...cur, sequence: e.target.value }))}
        required
      />
      <div className="flex gap-2 pt-2">
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
        {isEditing ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary hover:bg-surface-container"
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
        ) : null}
      </div>
    </form>
  );
}
