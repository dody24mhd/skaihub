"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RankPromotionEvent,
  RankPromotionParticipant,
  SportRank,
  Student,
  addAkademiRankPromotionParticipant,
  createAkademiRankPromotionEvent,
  getAkademiMe,
  getAkademiRankPromotionEvent,
  getAkademiRankPromotionEvents,
  getAkademiSportRanks,
  getAkademiStudents,
  updateAkademiRankPromotionEvent,
  updateAkademiRankPromotionParticipant,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const eventStatusLabels: Record<RankPromotionEvent["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const resultLabels: Record<RankPromotionParticipant["result"], string> = {
  registered: "Terdaftar",
  passed: "Lulus",
  failed: "Tidak lulus",
  absent: "Tidak hadir",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function AcademyRankPromotionsManager() {
  const tokenRef = useRef("");
  const [events, setEvents] = useState<RankPromotionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RankPromotionEvent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [ranks, setRanks] = useState<SportRank[]>([]);
  const [eventName, setEventName] = useState("Kenaikan Tingkat");
  const [eventDate, setEventDate] = useState(today());
  const [studentId, setStudentId] = useState("");
  const [toRankId, setToRankId] = useState("");
  const [participantResult, setParticipantResult] = useState<RankPromotionParticipant["result"]>("registered");
  const [participantScore, setParticipantScore] = useState("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [query, setQuery] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const participants = useMemo(() => selectedEvent?.participants || [], [selectedEvent]);
  const participantStudentIds = useMemo(() => new Set(participants.map((item) => item.student_id)), [participants]);
  const availableStudents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchKeyword = !keyword || [student.name, student.member_number, student.primary_class?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword));
      return matchKeyword && !participantStudentIds.has(student.id);
    });
  }, [participantStudentIds, query, students]);

  const loadBaseData = useCallback(async (activeToken: string, preferredEventId?: number) => {
    const [profileData, eventData, studentData, rankData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiRankPromotionEvents(activeToken),
      getAkademiStudents(activeToken),
      getAkademiSportRanks(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setEvents(eventData.data);
    setStudents(studentData.data.data.filter((student) => student.status === "active"));
    setRanks(rankData.data);

    const defaultEvent = eventData.data.find((item) => item.id === preferredEventId) || eventData.data[0];
    if (defaultEvent) {
      const detail = await getAkademiRankPromotionEvent(activeToken, defaultEvent.id);
      setSelectedEvent(detail.rank_promotion_event);
    }
  }, []);

  async function refreshSelected(eventId = selectedEvent?.id) {
    if (!eventId) return;
    const detail = await getAkademiRankPromotionEvent(tokenRef.current, eventId);
    setSelectedEvent(detail.rank_promotion_event);
    const eventData = await getAkademiRankPromotionEvents(tokenRef.current);
    setEvents(eventData.data);
  }

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      loadBaseData(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat kenaikan tingkat."))
        .finally(() => setIsLoading(false));
    });
  }, [loadBaseData]);

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const created = await createAkademiRankPromotionEvent(tokenRef.current, {
        name: eventName,
        event_date: eventDate,
        status: "draft",
      });
      await loadBaseData(tokenRef.current, created.rank_promotion_event.id);
      await refreshSelected(created.rank_promotion_event.id);
      setMessage("Event kenaikan tingkat dibuat.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuat event.");
    } finally {
      setIsSaving(false);
    }
  }

  async function selectEvent(eventId: string) {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await refreshSelected(Number(eventId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat event.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await addAkademiRankPromotionParticipant(tokenRef.current, selectedEvent.id, {
        student_id: Number(studentId),
        to_rank_id: Number(toRankId),
        result: participantResult,
        score: participantScore ? Number(participantScore) : null,
        notes: participantNotes || null,
      });
      await refreshSelected(selectedEvent.id);
      setStudentId("");
      setParticipantResult("registered");
      setParticipantScore("");
      setParticipantNotes("");
      setMessage("Peserta kenaikan tingkat ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menambah peserta.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleParticipantResult(participant: RankPromotionParticipant, result: RankPromotionParticipant["result"]) {
    if (!selectedEvent) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await updateAkademiRankPromotionParticipant(tokenRef.current, selectedEvent.id, participant.id, { result });
      await refreshSelected(selectedEvent.id);
      setMessage(`Hasil ${participant.student?.name || "peserta"} menjadi ${resultLabels[result].toLowerCase()}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memperbarui hasil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEventStatus(status: RankPromotionEvent["status"]) {
    if (!selectedEvent) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await updateAkademiRankPromotionEvent(tokenRef.current, selectedEvent.id, { status });
      await refreshSelected(selectedEvent.id);
      setMessage(`Status event menjadi ${eventStatusLabels[status].toLowerCase()}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memperbarui event.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat kenaikan tingkat...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6">
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
            <p className="mt-2 text-2xl font-black text-success">{participants.filter((item) => item.result === "passed").length}</p>
            <p className="text-sm text-muted">Otomatis update tingkatan</p>
          </article>
        </div>

        <section className="card-soft rounded-lg bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="label-caps text-secondary">Ujian / UKT</p>
              <h2 className="font-heading text-xl font-bold text-primary">Peserta Kenaikan Tingkat</h2>
            </div>
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={selectedEvent?.id || ""} onChange={(event) => selectEvent(event.target.value)}>
              <option value="">Pilih event</option>
              {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          {selectedEvent ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{eventStatusLabels[selectedEvent.status]}</span>
              <span>{shortDate(selectedEvent.event_date)}</span>
              {canManage ? (
                <>
                  <button className="rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" type="button" onClick={() => handleEventStatus("completed")} disabled={isSaving || selectedEvent.status === "completed"}>Selesaikan</button>
                  <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" type="button" onClick={() => handleEventStatus("cancelled")} disabled={isSaving || selectedEvent.status === "cancelled"}>Batalkan</button>
                </>
              ) : null}
            </div>
          ) : null}

          {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
          {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                  <th className="pb-3">Siswa</th>
                  <th className="pb-3">Dari</th>
                  <th className="pb-3">Ke</th>
                  <th className="pb-3">Nilai</th>
                  <th className="pb-3">Hasil</th>
                  {canManage ? <th className="pb-3 text-right">Aksi</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-bold text-primary">
                      {item.student?.name || "-"}
                      <span className="block text-xs font-medium text-muted">{item.student?.member_number || ""}</span>
                    </td>
                    <td className="py-3 text-muted">{item.from_rank?.label || "-"}</td>
                    <td className="py-3 text-muted">{item.to_rank?.label || "-"}</td>
                    <td className="py-3 text-muted">{item.score ?? "-"}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.result === "passed" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                        {resultLabels[item.result]}
                      </span>
                    </td>
                    {canManage ? (
                      <td className="py-3 text-right">
                        <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" type="button" onClick={() => handleParticipantResult(item, "passed")} disabled={isSaving}>Lulus</button>
                        <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" type="button" onClick={() => handleParticipantResult(item, "failed")} disabled={isSaving}>Gagal</button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!participants.length ? (
                  <tr>
                    <td className="py-8 text-sm text-muted" colSpan={canManage ? 6 : 5}>Belum ada peserta di event ini.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {canManage ? (
        <aside className="space-y-6">
          <section className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Event Baru</p>
            <h2 className="font-heading text-lg font-bold text-primary">Kenaikan Tingkat</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCreateEvent}>
              <label className="block text-sm font-semibold text-primary">
                Nama event
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={eventName} onChange={(event) => setEventName(event.target.value)} required />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Tanggal
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required />
              </label>
              <button className="h-11 w-full rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">Buat Event</button>
            </form>
          </section>

          <section className="card-soft rounded-lg bg-white p-5">
            <p className="label-caps text-secondary">Peserta</p>
            <h2 className="font-heading text-lg font-bold text-primary">Tambah Peserta</h2>
            <form className="mt-4 space-y-4" onSubmit={handleAddParticipant}>
              <input className="h-10 w-full rounded-md border border-border px-3 text-sm" placeholder="Cari siswa" value={query} onChange={(event) => setQuery(event.target.value)} />
              <label className="block text-sm font-semibold text-primary">
                Siswa
                <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
                  <option value="">Pilih siswa</option>
                  {availableStudents.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.current_rank?.label || "Belum ada rank"}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-primary">
                Naik ke
                <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={toRankId} onChange={(event) => setToRankId(event.target.value)} required>
                  <option value="">Pilih tingkatan</option>
                  {ranks.map((rank) => <option key={rank.id} value={rank.id}>{rank.label}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-primary">
                  Hasil
                  <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={participantResult} onChange={(event) => setParticipantResult(event.target.value as RankPromotionParticipant["result"])}>
                    <option value="registered">Terdaftar</option>
                    <option value="passed">Lulus</option>
                    <option value="failed">Tidak lulus</option>
                    <option value="absent">Tidak hadir</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-primary">
                  Nilai
                  <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="number" min="0" max="100" value={participantScore} onChange={(event) => setParticipantScore(event.target.value)} />
                </label>
              </div>
              <label className="block text-sm font-semibold text-primary">
                Catatan
                <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm" value={participantNotes} onChange={(event) => setParticipantNotes(event.target.value)} />
              </label>
              <button className="h-11 w-full rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving || !selectedEvent} type="submit">Tambah Peserta</button>
            </form>
          </section>
        </aside>
      ) : null}
    </div>
  );
}
