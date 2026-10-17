"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { FormField, SheetModal } from "../ui";
import { AchievementFormState } from "./achievement-form";

export default function AchievementFormModal({
  isOpen,
  isEditing,
  form,
  setForm,
  error,
  saveError,
  isSaving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isEditing: boolean;
  form: AchievementFormState;
  setForm: Dispatch<SetStateAction<AchievementFormState>>;
  error: string;
  saveError: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function setField(key: keyof AchievementFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Prestasi" : "Tambah Prestasi"}
      description="Catat kejuaraan atau penghargaan yang diraih siswa."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField
          id="achievement-title"
          label="Judul prestasi"
          required
          maxLength={255}
          placeholder="Contoh: Juara 1 Kyorugi -45 kg"
          value={form.title}
          error={error}
          onChange={(event) => setField("title", event.target.value)}
        />
        <FormField
          id="achievement-event"
          label="Nama event"
          maxLength={255}
          value={form.event_name}
          onChange={(event) => setField("event_name", event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="achievement-date"
            label="Tanggal"
            type="date"
            value={form.achieved_on}
            onChange={(event) => setField("achieved_on", event.target.value)}
          />
          <FormField
            id="achievement-result"
            label="Hasil"
            maxLength={100}
            placeholder="Emas, Perak, Juara Umum"
            value={form.result_label}
            onChange={(event) => setField("result_label", event.target.value)}
          />
        </div>
        <FormField id="achievement-notes" label="Catatan">
          <textarea
            id="achievement-notes"
            className="min-h-20 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </FormField>
        {saveError ? <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{saveError}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 flex-1 bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
            {isSaving ? "Menyimpan..." : "Simpan Prestasi"}
          </button>
          <button className="min-h-11 border border-border px-4 text-sm font-bold text-primary" onClick={onClose} type="button">
            Batal
          </button>
        </div>
      </form>
    </SheetModal>
  );
}
