"use client";

import { FormEvent } from "react";
import {
  RankPromotionEvent,
  RankPromotionParticipant,
  SportRank,
  Student,
} from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";

export type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  setEventName: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  isSaving: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CreateEventModal({
  isOpen,
  onClose,
  eventName,
  setEventName,
  eventDate,
  setEventDate,
  isSaving,
  onSubmit,
}: CreateEventModalProps) {
  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Kenaikan Tingkat"
      description="Buat jadwal event UKT atau ujian kenaikan tingkat baru."
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          await onSubmit(e);
          onClose();
        }}
      >
        <FormField
          id="modal-event-name"
          label="Nama event"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
        <FormField
          id="modal-event-date"
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
          {isSaving ? "Menyimpan..." : "Buat Event"}
        </button>
      </form>
    </SheetModal>
  );
}

export type AddParticipantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: RankPromotionEvent | null;
  query: string;
  setQuery: (val: string) => void;
  studentId: string;
  setStudentId: (val: string) => void;
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
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function AddParticipantModal({
  isOpen,
  onClose,
  selectedEvent,
  query,
  setQuery,
  studentId,
  setStudentId,
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
  onSubmit,
}: AddParticipantModalProps) {
  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Peserta UKT"
      description={`Daftarkan siswa ke event ${selectedEvent?.name || ""}.`}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          await onSubmit(e);
          onClose();
        }}
      >
        <FormField
          id="modal-query"
          label="Cari Siswa"
          placeholder="Ketik nama atau nomor anggota"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="modal-student-select"
            className="text-xs font-bold uppercase tracking-wide text-primary"
          >
            Siswa <span className="text-secondary">*</span>
          </label>
          <select
            id="modal-student-select"
            className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base text-primary focus:border-primary sm:text-sm"
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="modal-rank-select"
            className="text-xs font-bold uppercase tracking-wide text-primary"
          >
            Naik ke Tingkatan <span className="text-secondary">*</span>
          </label>
          <select
            id="modal-rank-select"
            className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base text-primary focus:border-primary sm:text-sm"
            value={toRankId}
            onChange={(e) => setToRankId(e.target.value)}
            required
          >
            <option value="">Pilih tingkatan</option>
            {ranks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-result-select"
              className="text-xs font-bold uppercase tracking-wide text-primary"
            >
              Hasil
            </label>
            <select
              id="modal-result-select"
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base text-primary focus:border-primary sm:text-sm"
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
            id="modal-score"
            label="Nilai Ujian"
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            placeholder="0-100"
            value={participantScore}
            onChange={(e) => setParticipantScore(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="modal-notes"
            className="text-xs font-bold uppercase tracking-wide text-primary"
          >
            Catatan
          </label>
          <textarea
            id="modal-notes"
            rows={2}
            className="min-h-20 w-full rounded-md border border-border bg-white p-3 text-sm text-primary placeholder:text-muted/50 focus:border-primary"
            value={participantNotes}
            onChange={(e) => setParticipantNotes(e.target.value)}
            placeholder="Catatan penguji atau dewan sabuk"
          />
        </div>

        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
          disabled={isSaving || !selectedEvent}
          type="submit"
        >
          {isSaving ? "Menyimpan..." : "Tambah Peserta"}
        </button>
      </form>
    </SheetModal>
  );
}
