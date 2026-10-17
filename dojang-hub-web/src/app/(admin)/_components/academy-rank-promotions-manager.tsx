"use client";

import Link from "next/link";
import { RankPromotionParticipant } from "../_lib/admin-api";
import {
  AddParticipantModal,
  CreateEventModal,
} from "./evaluation/rank-promotion-modals";
import RankPromotionAside from "./evaluation/rank-promotion-aside";
import {
  eventStatusLabels,
  resultLabels,
  useRankPromotions,
} from "./evaluation/use-rank-promotions";
import { shortDate } from "./evaluation/evaluation-types";
import { ResponsiveColumn, ResponsiveList } from "./ui";
import StatusMessage from "./ui/status-message";
import Icon from "./ui/icon";

export default function AcademyRankPromotionsManager() {
  const {
    events,
    selectedEvent,
    ranks,
    eventName,
    setEventName,
    eventDate,
    setEventDate,
    studentId,
    setStudentId,
    selectedStudent,
    toRankId,
    setToRankId,
    participantResult,
    setParticipantResult,
    participantScore,
    setParticipantScore,
    participantNotes,
    setParticipantNotes,
    query,
    setQuery,
    canManage,
    isCreateEventModalOpen,
    setIsCreateEventModalOpen,
    isAddParticipantModalOpen,
    setIsAddParticipantModalOpen,
    isLoading,
    isSaving,
    message,
    error,
    participants,
    availableStudents,
    handleCreateEvent,
    selectEvent,
    handleAddParticipant,
    handleParticipantResult,
    handleEventStatus,
  } = useRankPromotions();

  const columns: ResponsiveColumn<RankPromotionParticipant>[] = [
    {
      key: "student",
      header: "Siswa",
      primary: true,
      render: (item) => (
        <div>
          <p className="font-bold text-primary">{item.student?.name || "-"}</p>
          <span className="block text-xs font-medium text-muted">
            {item.student?.member_number || ""}
          </span>
        </div>
      ),
    },
    {
      key: "from_rank",
      header: "Dari",
      render: (item) => <span className="text-muted">{item.from_rank?.label || "-"}</span>,
    },
    {
      key: "to_rank",
      header: "Ke",
      render: (item) => (
        <span className="font-semibold text-primary">{item.to_rank?.label || "-"}</span>
      ),
    },
    {
      key: "score",
      header: "Nilai",
      render: (item) => <span className="text-muted">{item.score ?? "-"}</span>,
    },
    {
      key: "result",
      header: "Hasil",
      render: (item) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
            item.result === "passed"
              ? "bg-success/10 text-success-strong"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          {resultLabels[item.result]}
        </span>
      ),
    },
    {
      key: "certificate",
      header: "Sertifikat",
      render: (item) =>
        item.result === "passed" ? (
          <Link
            aria-label={`Sertifikat ${item.student?.name || "peserta"}`}
            className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary underline-offset-2 hover:underline"
            href={`/academy/rank-promotions/${item.rank_promotion_event_id}/certificates/${item.id}`}
          >
            <Icon className="text-[16px]" name="workspace_premium" />
            Sertifikat
          </Link>
        ) : (
          <span className="text-xs text-muted">-</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "Aksi",
            className: "text-right",
            render: (item: RankPromotionParticipant) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:bg-surface-container"
                  type="button"
                  onClick={() => handleParticipantResult(item, "passed")}
                  disabled={isSaving}
                >
                  Lulus
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
                  type="button"
                  onClick={() => handleParticipantResult(item, "failed")}
                  disabled={isSaving}
                >
                  Gagal
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat kenaikan tingkat...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Event</p>
          <p className="mt-2 text-2xl font-black text-primary">{events.length}</p>
          <p className="text-sm text-muted">Riwayat kenaikan tingkat</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Peserta</p>
          <p className="mt-2 text-2xl font-black text-primary">{participants.length}</p>
          <p className="text-sm text-muted">Dalam event terpilih</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Lulus</p>
          <p className="mt-2 text-2xl font-black text-success-strong">
            {participants.filter((item) => item.result === "passed").length}
          </p>
          <p className="text-sm text-muted">Otomatis update tingkatan</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <div className="card-soft rounded-lg bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label-caps text-secondary">Ujian / UKT</p>
                <h2 className="font-heading text-xl font-bold text-primary">
                  Peserta Kenaikan Tingkat
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary sm:w-auto"
                  value={selectedEvent?.id || ""}
                  onChange={(e) => selectEvent(e.target.value)}
                  aria-label="Pilih event kenaikan tingkat"
                >
                  <option value="">Pilih event</option>
                  {events.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                {canManage ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCreateEventModalOpen(true)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:bg-surface-container sm:w-auto xl:hidden"
                    >
                      + Event Baru
                    </button>
                    <button
                      type="button"
                      disabled={!selectedEvent}
                      onClick={() => setIsAddParticipantModalOpen(true)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-secondary px-3 text-xs font-bold text-white transition hover:bg-secondary-dark disabled:bg-muted sm:w-auto xl:hidden"
                    >
                      + Tambah Peserta
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {selectedEvent ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
                  {eventStatusLabels[selectedEvent.status]}
                </span>
                <span>{shortDate(selectedEvent.event_date)}</span>
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:bg-surface-container"
                      type="button"
                      onClick={() => handleEventStatus("completed")}
                      disabled={isSaving || selectedEvent.status === "completed"}
                    >
                      Selesaikan
                    </button>
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
                      type="button"
                      onClick={() => handleEventStatus("cancelled")}
                      disabled={isSaving || selectedEvent.status === "cancelled"}
                    >
                      Batalkan
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <StatusMessage tone="success" message={message} className="mt-4" />
            <StatusMessage tone="error" message={error} className="mt-4" />

            <div className="mt-5">
              <ResponsiveList
                columns={columns}
                rows={participants}
                getRowKey={(item) => item.id}
                ariaLabel="Daftar Peserta UKT"
                emptyState={
                  <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
                    Belum ada peserta di event ini.
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {canManage ? (
          <RankPromotionAside
            eventName={eventName}
            setEventName={setEventName}
            eventDate={eventDate}
            setEventDate={setEventDate}
            query={query}
            setQuery={setQuery}
            studentId={studentId}
            setStudentId={setStudentId}
            selectedStudent={selectedStudent}
            availableStudents={availableStudents}
            toRankId={toRankId}
            setToRankId={setToRankId}
            ranks={ranks}
            participantResult={participantResult}
            setParticipantResult={setParticipantResult}
            participantScore={participantScore}
            setParticipantScore={setParticipantScore}
            participantNotes={participantNotes}
            setParticipantNotes={setParticipantNotes}
            isSaving={isSaving}
            selectedEvent={selectedEvent}
            handleCreateEvent={handleCreateEvent}
            handleAddParticipant={handleAddParticipant}
          />
        ) : null}
      </div>

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        eventName={eventName}
        setEventName={setEventName}
        eventDate={eventDate}
        setEventDate={setEventDate}
        isSaving={isSaving}
        onSubmit={handleCreateEvent}
      />

      <AddParticipantModal
        isOpen={isAddParticipantModalOpen}
        onClose={() => setIsAddParticipantModalOpen(false)}
        selectedEvent={selectedEvent}
        query={query}
        setQuery={setQuery}
        studentId={studentId}
        setStudentId={setStudentId}
        selectedStudent={selectedStudent}
        availableStudents={availableStudents}
        toRankId={toRankId}
        setToRankId={setToRankId}
        ranks={ranks}
        participantResult={participantResult}
        setParticipantResult={setParticipantResult}
        participantScore={participantScore}
        setParticipantScore={setParticipantScore}
        participantNotes={participantNotes}
        setParticipantNotes={setParticipantNotes}
        isSaving={isSaving}
        onSubmit={handleAddParticipant}
      />
    </div>
  );
}
