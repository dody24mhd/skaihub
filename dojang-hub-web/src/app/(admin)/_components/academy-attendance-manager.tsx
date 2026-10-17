"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AttendanceStatus,
  Coach,
  TrainingClass,
  TrainingSession,
  createAkademiTrainingSession,
  getAkademiClasses,
  getAkademiCoaches,
  getAkademiMe,
  getAkademiTrainingSession,
  uploadAkademiFile,
  updateAkademiTrainingSessionAttendance,
} from "../_lib/admin-api";
import AttendanceSummaryBar from "./attendance/attendance-summary-bar";
import AttendanceSessionCreate from "./attendance/attendance-session-create";
import AttendanceSessionInfo from "./attendance/attendance-session-info";
import AttendanceStudentList from "./attendance/attendance-student-list";

const TOKEN_KEY = "skaihub_admin_token";

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

const statusLabels: Record<TrainingSession["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Batal",
  rescheduled: "Dipindah",
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function time(value: string) {
  return value?.slice(0, 5) || "";
}

export function normalizeStatus(value: string | null | undefined): AttendanceStatus {
  if (value === "present" || value === "hadir") return "present";
  if (value === "excused" || value === "izin") return "excused";
  if (value === "sick" || value === "sakit") return "sick";
  return "absent";
}

export type AcademyAttendanceManagerProps = {
  initialDate?: string;
  initialSessionId?: number;
};

export default function AcademyAttendanceManager({
  initialDate,
  initialSessionId,
}: AcademyAttendanceManagerProps) {
  const tokenRef = useRef("");
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selected, setSelected] = useState<TrainingSession | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(true);
  const [activeDate, setActiveDate] = useState(initialDate || formatLocalDate(new Date()));
  const [role, setRole] = useState("");
  const [draftSessionType, setDraftSessionType] = useState<TrainingSession["session_type"]>("regular");
  const [draftClassId, setDraftClassId] = useState("");
  const [draftStartsAt, setDraftStartsAt] = useState("");
  const [draftEndsAt, setDraftEndsAt] = useState("");
  const [material, setMaterial] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrls, setPhotoUrls] = useState("");
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [attendanceEdits, setAttendanceEdits] = useState<Record<number, AttendanceStatus>>({});
  const [extraName, setExtraName] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canPickAnyDate = ["ketua_akademi", "admin_akademi"].includes(role);
  const effectiveActiveDate = canPickAnyDate ? activeDate : formatLocalDate(new Date());

  const openSession = useCallback((session: TrainingSession) => {
    setSelected(session);
    setIsCreateFormOpen(false);
    setMaterial(session.material || "");
    setNotes(session.notes || "");
    setPhotoUrls((session.photo_urls || []).join("\n"));
    setSelectedCoachIds(
      session.coaches?.length
        ? session.coaches.map((c) => String(c.id))
        : session.coach_id
        ? [String(session.coach_id)]
        : []
    );
    setAttendanceEdits(
      Object.fromEntries(
        (session.attendances || []).map((att) => [att.id, normalizeStatus(att.status)])
      )
    );
    setMessage("");
    setError("");
  }, []);

  const loadData = useCallback(
    async (activeToken: string) => {
      const [profileData, classData] = await Promise.all([
        getAkademiMe(activeToken),
        getAkademiClasses(activeToken),
      ]);
      const coachData = ["ketua_akademi", "admin_akademi"].includes(profileData.user.role)
        ? await getAkademiCoaches(activeToken)
        : { data: [] };

      setCanCreate(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
      setRole(profileData.user.role);
      setClasses(classData.data.filter((item) => item.is_active));
      setCoaches(coachData.data.filter((item) => item.is_active));

      if (initialSessionId) {
        const sessionData = await getAkademiTrainingSession(activeToken, initialSessionId);
        openSession(sessionData.training_session);
        setActiveDate(sessionData.training_session.session_date.slice(0, 10));
      } else if (initialDate) {
        setActiveDate(initialDate);
        setIsCreateFormOpen(true);
      }
    },
    [initialDate, initialSessionId, openSession]
  );

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      loadData(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat absensi."))
        .finally(() => setIsLoading(false));
    });
  }, [loadData]);

  async function handleCreateSessionFromDraft() {
    if (!draftClassId || !draftStartsAt || !draftEndsAt) {
      setError("Lengkapi kelas, jam mulai, dan jam selesai untuk membuka absensi.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await createAkademiTrainingSession(tokenRef.current, {
        training_schedule_id: null,
        class_id: draftClassId ? Number(draftClassId) : undefined,
        session_date: effectiveActiveDate,
        source_schedule_date: null,
        starts_at: draftStartsAt || undefined,
        ends_at: draftEndsAt || undefined,
        session_type: draftSessionType,
      });

      await loadData(tokenRef.current);
      openSession(response.training_session);
      setMessage("Berita acara dibuat. Silakan isi kehadiran.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuat berita acara absensi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAttendance(status: TrainingSession["status"] = "draft") {
    if (!selected) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateAkademiTrainingSessionAttendance(tokenRef.current, selected.id, {
        material: material || null,
        notes: notes || null,
        photo_urls: photoUrls.split("\n").map((v) => v.trim()).filter(Boolean),
        ...(canCreate ? { coach_ids: selectedCoachIds.map(Number) } : {}),
        status,
        attendances: (selected.attendances || [])
          .filter((att) => !att.is_extra_participant)
          .map((att) => ({
            id: att.id,
            status: attendanceEdits[att.id] || normalizeStatus(att.status),
          })),
        extra_participants: extraName.trim()
          ? [{ participant_name: extraName.trim(), status: "present", notes: "Peserta tambahan" }]
          : [],
      });

      await loadData(tokenRef.current);
      openSession(response.training_session);
      setExtraName("");
      setMessage(status === "completed" ? "Absensi diselesaikan." : "Absensi disimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan absensi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSessionPhotoUpload(file: File | null) {
    if (!file) return;

    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      const result = await uploadAkademiFile(tokenRef.current, file, "session_photo");
      setPhotoUrls((cur) => [cur.trim(), result.url].filter(Boolean).join("\n"));
      setMessage("Foto sesi terupload.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal upload foto sesi.");
    } finally {
      setIsUploading(false);
    }
  }

  function setAllAttendance(status: AttendanceStatus) {
    if (!selected) return;
    setAttendanceEdits(
      Object.fromEntries(
        (selected.attendances || [])
          .filter((att) => !att.is_extra_participant)
          .map((att) => [att.id, status])
      )
    );
  }

  function setAttendanceStatus(attendanceId: number, status: AttendanceStatus) {
    setAttendanceEdits((cur) => ({ ...cur, [attendanceId]: status }));
  }

  function toggleSelectedCoach(coachId: number) {
    const val = String(coachId);
    setSelectedCoachIds((cur) =>
      cur.includes(val) ? cur.filter((id) => id !== val) : [...cur, val]
    );
  }

  function removePhoto(url: string) {
    setPhotoUrls((cur) =>
      cur
        .split("\n")
        .map((v) => v.trim())
        .filter((v) => v && v !== url)
        .join("\n")
    );
  }

  const counts = useMemo<Record<AttendanceStatus, number>>(() => {
    const result: Record<AttendanceStatus, number> = {
      present: 0,
      excused: 0,
      sick: 0,
      absent: 0,
    };
    if (!selected?.attendances) return result;
    for (const item of selected.attendances) {
      const st = attendanceEdits[item.id] || normalizeStatus(item.status);
      if (result[st] !== undefined) {
        result[st] += 1;
      }
    }
    return result;
  }, [attendanceEdits, selected]);

  if (isLoading) return <p className="text-sm font-medium text-muted">Memuat absensi...</p>;

  return (
    <div className="space-y-6">
      <section className="border-2 border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 bg-secondary" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
                Absensi
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-primary">
              {selected
                ? selected.class?.name || "Sesi Latihan"
                : isCreateFormOpen
                ? "Buka Absensi"
                : "Pilih sesi latihan"}
            </h2>
            {selected ? (
              <p className="mt-1 text-sm text-muted">
                {selected.session_date.slice(0, 10)} · {time(selected.starts_at)} - {time(selected.ends_at)} · {sessionTypeLabels[selected.session_type]}
              </p>
            ) : null}
          </div>
          {selected ? (
            <span className="inline-flex h-8 items-center border border-border bg-surface-container-low px-3 text-xs font-bold uppercase text-primary">
              {statusLabels[selected.status]}
            </span>
          ) : null}
        </div>

        {message ? (
          <p className="mt-4 border-2 border-success/30 bg-success/10 p-3 text-sm font-bold text-success">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 border-2 border-secondary/30 bg-secondary/10 p-3 text-sm font-bold text-secondary">
            {error}
          </p>
        ) : null}

        {!selected && !isCreateFormOpen ? (
          <p className="mt-8 text-sm text-muted">
            Buka absensi baru atau pilih sesi dari kalender absensi untuk melanjutkan.
          </p>
        ) : !selected ? (
          <AttendanceSessionCreate
            classes={classes}
            activeDate={effectiveActiveDate}
            onDateChange={setActiveDate}
            canPickAnyDate={canPickAnyDate}
            sessionType={draftSessionType}
            onSessionTypeChange={setDraftSessionType}
            classId={draftClassId}
            onClassChange={setDraftClassId}
            startsAt={draftStartsAt}
            onStartsAtChange={setDraftStartsAt}
            endsAt={draftEndsAt}
            onEndsAtChange={setDraftEndsAt}
            isSaving={isSaving}
            onSubmit={handleCreateSessionFromDraft}
          />
        ) : (
          <div className="mt-6 space-y-6">
            <AttendanceSessionInfo
              selected={selected}
              canCreate={canCreate}
              coaches={coaches}
              selectedCoachIds={selectedCoachIds}
              onToggleCoach={toggleSelectedCoach}
              material={material}
              onMaterialChange={setMaterial}
              extraName={extraName}
              onExtraNameChange={setExtraName}
              notes={notes}
              onNotesChange={setNotes}
              photoUrls={photoUrls}
              onPhotoUpload={handleSessionPhotoUpload}
              onRemovePhoto={removePhoto}
              isUploading={isUploading}
            />

            {/* Daftar Hadir Peserta Latihan */}
            <AttendanceStudentList
              attendances={selected.attendances || []}
              attendanceEdits={attendanceEdits}
              onSetAll={setAllAttendance}
              onStatusChange={setAttendanceStatus}
            />

            {/* Ringkasan Sticky di Bawah (di atas bottom nav) & Tombol Simpan Penuh Lebar */}
            <AttendanceSummaryBar
              counts={counts}
              isSaving={isSaving}
              onSaveDraft={() => handleSaveAttendance("draft")}
              onComplete={() => handleSaveAttendance("completed")}
            />
          </div>
        )}
      </section>
    </div>
  );
}
