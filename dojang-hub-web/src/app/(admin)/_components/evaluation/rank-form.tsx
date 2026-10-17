"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { FormField } from "../ui";

const beltOptions = [
  { code: "white", label: "Putih", className: "bg-white border-slate-300" },
  { code: "yellow", label: "Kuning", className: "bg-yellow-300 border-yellow-500" },
  { code: "green", label: "Hijau", className: "bg-emerald-500 border-emerald-700" },
  { code: "blue", label: "Biru", className: "bg-blue-600 border-blue-800" },
  { code: "red", label: "Merah", className: "bg-red-600 border-red-800" },
  { code: "black", label: "Hitam", className: "bg-neutral-950 border-neutral-700" },
  { code: "poom", label: "Poom", className: "bg-red-600 border-neutral-900" },
];

export type RankFormValues = {
  code: string;
  label: string;
  sequence: string;
};

export const emptyRankForm: RankFormValues = {
  code: "",
  label: "",
  sequence: "1",
};

export function BeltIcon({ code, label }: { code: string; label: string }) {
  const option = beltOptions.find((item) => item.code === code);
  const className = option?.className || "bg-slate-200 border-slate-400";

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`relative inline-flex h-4 w-12 overflow-hidden rounded-sm border ${className}`}
        aria-hidden="true"
      >
        {code === "poom" ? (
          <span className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" />
        ) : null}
        <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/70" />
      </span>
      <span>{option?.label || label}</span>
    </span>
  );
}

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
        value={form.label}
        onChange={(e) => setForm((cur) => ({ ...cur, label: e.target.value }))}
        required
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">
          Icon warna
        </span>
        <div className="grid grid-cols-2 gap-2">
          {beltOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              aria-pressed={form.code === option.code}
              onClick={() => setForm((cur) => ({ ...cur, code: option.code }))}
              className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-sm font-bold transition ${
                form.code === option.code
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted hover:bg-surface-container"
              }`}
            >
              <BeltIcon code={option.code} label={option.label} />
            </button>
          ))}
        </div>
      </div>
      <FormField
        id={`${idPrefix}-code`}
        label="Kode custom"
        placeholder="Misal: dan-1, strip-1"
        value={form.code}
        onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value }))}
        required
      />
      <FormField
        id={`${idPrefix}-sequence`}
        label="Urutan"
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
