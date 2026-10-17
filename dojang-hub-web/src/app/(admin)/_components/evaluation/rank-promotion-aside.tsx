"use client";

import { FormEvent } from "react";
import {
  RankPromotionEvent,
  RankPromotionParticipant,
  SportRank,
  Student,
} from "../../_lib/admin-api";
import RankTargetField from "./rank-target-field";
import { FormField } from "../ui";

export type RankPromotionAsideProps = {
  eventName: string;
  setEventName: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  query: string;
  setQuery: (val: string) => void;
  studentId: string;
  setStudentId: (val: string) => void;
  selectedStudent: Student | undefined;
  availableStudents: Student[];
  toRankId: string;
  setToRankId: (val: string) => void;
  ranks: SportRank[];
  participantResult: RankPromotionParticipant["result"];
  setParticipantResult: (val: RankPromotionParticipant["result"]) => void;
  participantScore: string;
  setParticipantScore: (val: string) => void;
  participantNotes: string;
  setParticipantNotes: (val: string) => void;
  isSaving: boolean;
  selectedEvent: RankPromotionEvent | null;
  handleCreateEvent: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handleAddParticipant: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function RankPromotionAside({
  eventName,
  setEventName,
  eventDate,
  setEventDate,
  query,
  setQuery,
  studentId,
  setStudentId,
  selectedStudent,
  availableStudents,
  toRankId,
  setToRankId,
  ranks,
  participantResult,
  setParticipantResult,
  participantScore,
  setParticipantScore,
  participantNotes,
  setParticipantNotes,
  isSaving,
  selectedEvent,
  handleCreateEvent,
  handleAddParticipant,
}: RankPromotionAsideProps) {
  return (
    <aside className="hidden space-y-6 xl:block">
      <section className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Event Baru</p>
        <h2 className="font-heading text-lg font-bold text-primary">Kenaikan Tingkat</h2>
        <form className="mt-4 space-y-4" onSubmit={handleCreateEvent}>
          <FormField
            id="aside-event-name"
            label="Nama event"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
          <FormField
            id="aside-event-date"
            label="Tanggal"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
            disabled={isSaving}
            type="submit"
          >
            Buat Event
          </button>
        </form>
      </section>

      <section className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Peserta</p>
        <h2 className="font-heading text-lg font-bold text-primary">Tambah Peserta</h2>
        <form className="mt-4 space-y-4" onSubmit={handleAddParticipant}>
          <FormField
            id="aside-search-student"
            label="Cari Siswa"
            placeholder="Cari siswa"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="aside-student-select"
              className="text-xs font-bold uppercase tracking-wide text-primary"
            >
              Siswa <span className="text-secondary">*</span>
            </label>
            <select
              id="aside-student-select"
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-primary"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Pilih siswa</option>
              {availableStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} - {st.current_rank?.label || "Belum ada rank"}
                </option>
              ))}
            </select>
          </div>
          <RankTargetField
            id="aside-rank-select"
            label="Naik ke"
            ranks={ranks}
            student={selectedStudent}
            toRankId={toRankId}
            setToRankId={setToRankId}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="aside-result-select"
                className="text-xs font-bold uppercase tracking-wide text-primary"
              >
                Hasil
              </label>
              <select
                id="aside-result-select"
                className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-primary"
                value={participantResult}
                onChange={(e) =>
                  setParticipantResult(e.target.value as RankPromotionParticipant["result"])
                }
              >
                <option value="registered">Terdaftar</option>
                <option value="passed">Lulus</option>
                <option value="failed">Tidak lulus</option>
                <option value="absent">Tidak hadir</option>
              </select>
            </div>
            <FormField
              id="aside-score"
              label="Nilai"
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              value={participantScore}
              onChange={(e) => setParticipantScore(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="aside-notes"
              className="text-xs font-bold uppercase tracking-wide text-primary"
            >
              Catatan
            </label>
            <textarea
              id="aside-notes"
              rows={2}
              className="min-h-20 w-full rounded-md border border-border bg-white p-3 text-sm text-primary"
              value={participantNotes}
              onChange={(e) => setParticipantNotes(e.target.value)}
            />
          </div>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
            disabled={isSaving || !selectedEvent}
            type="submit"
          >
            Tambah Peserta
          </button>
        </form>
      </section>
    </aside>
  );
}
