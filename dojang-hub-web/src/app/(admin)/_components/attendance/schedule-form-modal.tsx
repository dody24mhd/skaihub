"use client";

import React, { FormEvent } from "react";
import { Coach, TrainingClass, TrainingPlace, TrainingSchedule } from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";

export type ScheduleFormData = {
  class_id: string;
  training_place_id: string;
  coach_ids: string[];
  day_of_week: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  notes: string;
};

const dayLabels: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

export type ScheduleFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editing: TrainingSchedule | null;
  form: ScheduleFormData;
  setForm: React.Dispatch<React.SetStateAction<ScheduleFormData>>;
  classes: TrainingClass[];
  places: TrainingPlace[];
  coaches: Coach[];
  isSaving: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ScheduleFormModal({
  isOpen,
  onClose,
  editing,
  form,
  setForm,
  classes,
  places,
  coaches,
  isSaving,
  onSubmit,
}: ScheduleFormModalProps) {
  function toggleCoach(coachId: number) {
    const val = String(coachId);
    setForm((cur) => ({
      ...cur,
      coach_ids: cur.coach_ids.includes(val)
        ? cur.coach_ids.filter((id) => id !== val)
        : [...cur.coach_ids, val],
    }));
  }

  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Jadwal Latihan" : "Jadwal Reguler Baru"}
      description={
        editing
          ? `Perbarui jadwal ${editing.class?.name || "kelas"}`
          : "Tentukan kelas, hari, jam, dan pelatih reguler."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="schedule-class" label="Kelas" required>
          <select
            id="schedule-class"
            required
            value={form.class_id}
            onChange={(e) => setForm((cur) => ({ ...cur, class_id: e.target.value }))}
            className="min-h-11 w-full border border-border bg-white px-3.5 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Pilih kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="schedule-day" label="Hari" required>
          <select
            id="schedule-day"
            value={form.day_of_week}
            onChange={(e) => setForm((cur) => ({ ...cur, day_of_week: e.target.value }))}
            className="min-h-11 w-full border border-border bg-white px-3.5 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            {Object.entries(dayLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="schedule-start" label="Mulai" required>
            <input
              id="schedule-start"
              type="time"
              required
              value={form.starts_at}
              onChange={(e) => setForm((cur) => ({ ...cur, starts_at: e.target.value }))}
              className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
          <FormField id="schedule-end" label="Selesai" required>
            <input
              id="schedule-end"
              type="time"
              required
              value={form.ends_at}
              onChange={(e) => setForm((cur) => ({ ...cur, ends_at: e.target.value }))}
              className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
        </div>

        <FormField id="schedule-place" label="Tempat Latihan">
          <select
            id="schedule-place"
            value={form.training_place_id}
            onChange={(e) =>
              setForm((cur) => ({ ...cur, training_place_id: e.target.value }))
            }
            className="min-h-11 w-full border border-border bg-white px-3.5 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Ikuti tempat kelas</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        <fieldset className="block">
          <legend className="text-xs font-bold uppercase tracking-wider text-primary">
            Pelatih Default
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2 border border-border p-3">
            {coaches.map((c) => (
              <label
                key={c.id}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-border bg-white px-3 text-sm font-bold text-primary transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
              >
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={form.coach_ids.includes(String(c.id))}
                  onChange={() => toggleCoach(c.id)}
                />
                <span className="material-symbols-outlined text-[18px]">sports_martial_arts</span>
                {c.name}
              </label>
            ))}
            {!coaches.length ? (
              <p className="text-sm text-muted">Belum ada pelatih aktif.</p>
            ) : null}
          </div>
        </fieldset>

        <FormField id="schedule-notes" label="Catatan">
          <textarea
            id="schedule-notes"
            value={form.notes}
            onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
            placeholder="Catatan perlengkapan, lokasi khusus, dll."
            className="min-h-20 w-full border border-border bg-white p-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </FormField>

        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((cur) => ({ ...cur, is_active: e.target.checked }))}
            className="size-5 border-border text-primary focus:ring-primary"
          />
          Jadwal Aktif
        </label>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 flex-1 border-2 border-primary bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 border-2 border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-surface-container-low"
          >
            Batal
          </button>
        </div>
      </form>
    </SheetModal>
  );
}
