"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Coach,
  TodaySlot,
  cancelAkademiTrainingSession,
  getAkademiCoaches,
  rescheduleAkademiTrainingSession,
  updateAkademiTrainingSessionCoaches,
} from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";
import { resolveSlotSessionId } from "./today-utils";
import Icon from "../ui/icon";

export type SessionAction = "menu" | "reschedule" | "cancel" | "coach";

export type SessionActionSheetsProps = {
  token: string;
  slot: TodaySlot | null;
  action: SessionAction | null;
  onActionChange: (action: SessionAction | null) => void;
  onDone: (message: string) => void;
};

const inputClass =
  "min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm";
const primaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center border-2 border-primary bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted";
const menuButtonClass =
  "flex min-h-11 w-full items-center gap-3 border-2 border-border bg-white px-4 text-left text-sm font-bold text-primary transition hover:border-primary hover:bg-surface-container-low";

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

export default function SessionActionSheets({ token, slot, action, onActionChange, onDone }: SessionActionSheetsProps) {
  const [date, setDate] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachIds, setCoachIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slot || !action || action === "menu") return;
    queueMicrotask(() => {
      setDate("");
      setStartsAt(slot.starts_at);
      setEndsAt(slot.ends_at);
      setReason("");
      setCoachIds(slot.coach_ids);
      setError("");
    });
    if (action === "coach") {
      getAkademiCoaches(token)
        .then((response) => setCoaches(response.data.filter((coach) => coach.is_active)))
        .catch((caught) => setError(errorMessage(caught, "Gagal memuat daftar pelatih.")));
    }
  }, [action, slot, token]);

  if (!slot) return null;
  const close = () => onActionChange(null);

  async function submit(event: FormEvent, run: (sessionId: number) => Promise<string>) {
    event.preventDefault();
    if (!slot) return;
    setIsSaving(true);
    setError("");
    try {
      const sessionId = await resolveSlotSessionId(token, slot);
      if (!sessionId) throw new Error("Sesi ini tidak bisa diubah.");
      const message = await run(sessionId);
      onActionChange(null);
      onDone(message);
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menyimpan perubahan sesi."));
    } finally {
      setIsSaving(false);
    }
  }

  function toggleCoach(coachId: number) {
    setCoachIds((current) =>
      current.includes(coachId) ? current.filter((id) => id !== coachId) : [...current, coachId],
    );
  }

  const errorBox = error ? (
    <p role="alert" className="border-2 border-secondary/30 bg-secondary/10 p-3 text-sm font-bold text-secondary">
      {error}
    </p>
  ) : null;
  const title = `${slot.class_name || "Sesi"} · ${slot.date} ${slot.starts_at}`;

  return (
    <>
      <SheetModal isOpen={action === "menu"} onClose={close} title="Aksi Sesi" description={title}>
        <div className="space-y-2">
          <button type="button" className={menuButtonClass} onClick={() => onActionChange("reschedule")}>
            <Icon name="event_repeat" className="text-[20px]" />
            Pindah Jadwal
          </button>
          <button type="button" className={menuButtonClass} onClick={() => onActionChange("cancel")}>
            <Icon name="event_busy" className="text-[20px]" />
            Batalkan
          </button>
          <button type="button" className={menuButtonClass} onClick={() => onActionChange("coach")}>
            <Icon name="sports" className="text-[20px]" />
            Ganti Pelatih
          </button>
        </div>
      </SheetModal>

      <SheetModal isOpen={action === "reschedule"} onClose={close} title="Pindah Jadwal" description={title}>
        <form
          className="space-y-4"
          onSubmit={(event) =>
            submit(event, async (sessionId) => {
              await rescheduleAkademiTrainingSession(token, sessionId, { date, starts_at: startsAt, ends_at: endsAt, reason });
              return `Sesi dipindah ke ${date}.`;
            })
          }
        >
          <FormField id="reschedule-date" label="Tanggal Baru" required>
            <input id="reschedule-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="reschedule-starts" label="Mulai" required>
              <input id="reschedule-starts" type="time" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
            </FormField>
            <FormField id="reschedule-ends" label="Selesai" required>
              <input id="reschedule-ends" type="time" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
            </FormField>
          </div>
          <FormField id="reschedule-reason" label="Alasan" required>
            <textarea id="reschedule-reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="Mis. hujan deras" />
          </FormField>
          {errorBox}
          <button type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? "Menyimpan..." : "Pindahkan Sesi"}
          </button>
        </form>
      </SheetModal>

      <SheetModal isOpen={action === "cancel"} onClose={close} title="Batalkan Sesi" description={title}>
        <form
          className="space-y-4"
          onSubmit={(event) =>
            submit(event, async (sessionId) => {
              await cancelAkademiTrainingSession(token, sessionId, reason);
              return "Sesi dibatalkan.";
            })
          }
        >
          <FormField id="cancel-reason" label="Alasan" required>
            <textarea id="cancel-reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="Mis. dojang dipakai acara" />
          </FormField>
          {errorBox}
          <button type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? "Menyimpan..." : "Batalkan Sesi"}
          </button>
        </form>
      </SheetModal>

      <SheetModal isOpen={action === "coach"} onClose={close} title="Ganti Pelatih" description={title}>
        <form
          className="space-y-4"
          onSubmit={(event) =>
            submit(event, async (sessionId) => {
              await updateAkademiTrainingSessionCoaches(token, sessionId, coachIds);
              return "Pelatih sesi diperbarui.";
            })
          }
        >
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Pelatih Sesi</legend>
            {coaches.length === 0 && !error ? <p className="text-sm text-muted">Memuat pelatih...</p> : null}
            {coaches.map((coach) => (
              <label key={coach.id} className="flex min-h-11 items-center gap-3 border border-border px-3 text-sm text-primary">
                <input type="checkbox" className="size-5" checked={coachIds.includes(coach.id)} onChange={() => toggleCoach(coach.id)} />
                {coach.name}
              </label>
            ))}
          </fieldset>
          {errorBox}
          <button type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? "Menyimpan..." : "Simpan Pelatih"}
          </button>
        </form>
      </SheetModal>
    </>
  );
}
