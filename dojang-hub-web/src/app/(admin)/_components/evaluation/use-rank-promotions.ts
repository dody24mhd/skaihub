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
} from "../../_lib/admin-api";
import { ageOn, defaultNextRank } from "./rank-progression";

const TOKEN_KEY = "skaihub_admin_token";

export const eventStatusLabels: Record<RankPromotionEvent["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const resultLabels: Record<RankPromotionParticipant["result"], string> = {
  registered: "Terdaftar",
  passed: "Lulus",
  failed: "Tidak lulus",
  absent: "Tidak hadir",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function useRankPromotions() {
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
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === studentId),
    [students, studentId]
  );

  const participants = useMemo(() => selectedEvent?.participants || [], [selectedEvent]);
  const participantStudentIds = useMemo(
    () => new Set(participants.map((item) => item.student_id)),
    [participants]
  );

  const availableStudents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchKeyword =
        !keyword ||
        [student.name, student.member_number, student.primary_class?.name]
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

    const defaultEvent =
      eventData.data.find((item) => item.id === preferredEventId) || eventData.data[0];
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
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Gagal memuat kenaikan tingkat.")
        )
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
      const result = await addAkademiRankPromotionParticipant(tokenRef.current, selectedEvent.id, {
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
      setMessage(["Peserta kenaikan tingkat ditambahkan.", ...(result.warnings ?? [])].join(" "));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menambah peserta.");
    } finally {
      setIsSaving(false);
    }
  }

  function selectStudent(id: string) {
    setStudentId(id);
    const student = students.find((item) => String(item.id) === id);
    const next = student ? defaultNextRank(ranks, student.current_rank, ageOn(student.birth_date)) : null;
    setToRankId(next ? String(next.id) : "");
  }

  async function handleParticipantResult(
    participant: RankPromotionParticipant,
    result: RankPromotionParticipant["result"]
  ) {
    if (!selectedEvent) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await updateAkademiRankPromotionParticipant(
        tokenRef.current,
        selectedEvent.id,
        participant.id,
        { result }
      );
      await refreshSelected(selectedEvent.id);
      setMessage(
        `Hasil ${participant.student?.name || "peserta"} menjadi ${resultLabels[result].toLowerCase()}.`
      );
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

  return {
    events,
    selectedEvent,
    students,
    ranks,
    eventName,
    setEventName,
    eventDate,
    setEventDate,
    studentId,
    setStudentId: selectStudent,
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
  };
}
