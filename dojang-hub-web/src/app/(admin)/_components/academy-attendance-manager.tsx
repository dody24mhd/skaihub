"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Coach,
  TrainingClass,
  TrainingAttendance,
  TrainingSession,
  createAkademiTrainingSession,
  getAkademiClasses,
  getAkademiCoaches,
  getAkademiMe,
  getAkademiTrainingSession,
  uploadAkademiFile,
  updateAkademiTrainingSessionAttendance,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const statusLabels: Record<TrainingSession["status"], string> = {
  draft: "Draft",
  completed: "Selesai",
  cancelled: "Batal",
};

const attendanceLabels: Record<TrainingAttendance["status"], string> = {
  present: "Hadir",
  absent: "Tidak hadir",
  excused: "Izin",
};

const sessionTypeLabels: Record<TrainingSession["session_type"], string> = {
  regular: "Reguler",
  replacement: "Pengganti",
  extra: "Tambahan",
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function time(value: string) {
  return value.slice(0, 5);
}

type AcademyAttendanceManagerProps = {
  initialDate?: string;
  initialSessionId?: number;
};

export default function AcademyAttendanceManager({ initialDate, initialSessionId }: AcademyAttendanceManagerProps) {
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
  const [attendanceEdits, setAttendanceEdits] = useState<Record<number, TrainingAttendance["status"]>>({});
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
    setSelectedCoachIds((session.coaches?.length ? session.coaches.map((coach) => String(coach.id)) : session.coach_id ? [String(session.coach_id)] : []));
    setAttendanceEdits(
      Object.fromEntries((session.attendances || []).map((attendance) => [attendance.id, attendance.status])),
    );
    setMessage("");
    setError("");
  }, []);

  const loadData = useCallback(async (activeToken: string) => {
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
  }, [initialDate, initialSessionId, openSession]);

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

  function handleDraftClassChange(classId: string) {
    setDraftClassId(classId);
  }

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
        photo_urls: photoUrls.split("\n").map((value) => value.trim()).filter(Boolean),
        ...(canCreate ? { coach_ids: selectedCoachIds.map(Number) } : {}),
        status,
        attendances: (selected.attendances || [])
          .filter((attendance) => !attendance.is_extra_participant)
          .map((attendance) => ({
            id: attendance.id,
            status: attendanceEdits[attendance.id] || attendance.status,
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
      setPhotoUrls((current) => [current.trim(), result.url].filter(Boolean).join("\n"));
      setMessage("Foto sesi terupload.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal upload foto sesi.");
    } finally {
      setIsUploading(false);
    }
  }

  function setAllAttendance(status: TrainingAttendance["status"]) {
    if (!selected) return;
    setAttendanceEdits(
      Object.fromEntries(
        (selected.attendances || [])
          .filter((attendance) => !attendance.is_extra_participant)
          .map((attendance) => [attendance.id, status]),
      ),
    );
  }

  function setAttendanceStatus(attendanceId: number, status: TrainingAttendance["status"]) {
    setAttendanceEdits((current) => ({ ...current, [attendanceId]: status }));
  }

  function toggleSelectedCoach(coachId: number) {
    const value = String(coachId);
    setSelectedCoachIds((current) => (
      current.includes(value) ? current.filter((id) => id !== value) : [...current, value]
    ));
  }

  function removePhoto(url: string) {
    setPhotoUrls((current) => current.split("\n").map((value) => value.trim()).filter((value) => value && value !== url).join("\n"));
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat absensi...</p>;

  return (
    <div>
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Absensi</p>
            <h2 className="font-heading text-xl font-bold text-primary">
              {selected ? selected.class?.name || "Sesi Latihan" : isCreateFormOpen ? "Buka Absensi" : "Pilih sesi latihan"}
            </h2>
            {selected ? (
              <p className="mt-1 text-sm text-muted">
                {selected.session_date.slice(0, 10)} - {time(selected.starts_at)} sampai {time(selected.ends_at)} - {sessionTypeLabels[selected.session_type]}
              </p>
            ) : null}
          </div>
          {selected ? (
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-muted">
              {statusLabels[selected.status]}
            </span>
          ) : null}
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        {!selected && !isCreateFormOpen ? (
          <p className="mt-8 text-sm text-muted">Buka absensi baru atau pilih sesi dari kalender absensi untuk melanjutkan.</p>
        ) : !selected ? (
          <div className="mt-6 space-y-5">
            <div className="border-t border-border pt-5">
              <p className="label-caps text-secondary">Berita Acara</p>
              <h3 className="font-heading text-lg font-bold text-primary">Buka Absensi</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Pilih tipe absensi, kelas, dan jam latihan. Setelah berita acara dibuka, daftar hadir siswa akan dibuat otomatis dari kelas.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block text-sm font-semibold text-primary">
                Tanggal latihan
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary disabled:bg-surface-container" type="date" value={effectiveActiveDate} onChange={(event) => setActiveDate(event.target.value)} disabled={!canPickAnyDate} />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Tipe absensi
                <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={draftSessionType} onChange={(event) => setDraftSessionType(event.target.value as TrainingSession["session_type"])}>
                  <option value="regular">Reguler</option>
                  <option value="replacement">Pengganti</option>
                  <option value="extra">Tambahan</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-primary">
                Kelas absensi
                <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={draftClassId} onChange={(event) => handleDraftClassChange(event.target.value)}>
                  <option value="">Pilih kelas</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-primary">
                Mulai
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="time" value={draftStartsAt} onChange={(event) => setDraftStartsAt(event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Selesai
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="time" value={draftEndsAt} onChange={(event) => setDraftEndsAt(event.target.value)} />
              </label>
            </div>

            <button className="h-11 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted" disabled={isSaving} onClick={handleCreateSessionFromDraft} type="button">
              Buka Berita Acara
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-md border border-border bg-surface-container-low px-4 py-3">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Tanggal</p>
                  <p className="mt-1 font-bold text-primary">{selected.session_date.slice(0, 10)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Jam</p>
                  <p className="mt-1 font-bold text-primary">{time(selected.starts_at)} - {time(selected.ends_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Jenis</p>
                  <p className="mt-1 font-bold text-primary">{sessionTypeLabels[selected.session_type]}</p>
                </div>
              </div>
            </div>

            {canCreate ? (
              <fieldset className="block text-sm font-semibold text-primary">
                <legend>Pelatih sesi</legend>
                <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-border p-3">
                  {coaches.map((coach) => (
                    <label key={coach.id} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-bold text-primary transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white">
                      <input className="sr-only" type="checkbox" checked={selectedCoachIds.includes(String(coach.id))} onChange={() => toggleSelectedCoach(coach.id)} />
                      <span className="material-symbols-outlined text-[18px]">sports_martial_arts</span>
                      {coach.name}
                    </label>
                  ))}
                  {!coaches.length ? <p className="text-sm text-muted">Belum ada pelatih aktif.</p> : null}
                </div>
              </fieldset>
            ) : null}

            <div className="border-t border-border pt-5">
              <p className="label-caps text-secondary">Berita Acara</p>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-semibold text-primary">
                Materi latihan
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={material} onChange={(event) => setMaterial(event.target.value)} />
              </label>
              <label className="block text-sm font-semibold text-primary">
                Peserta tambahan
                <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={extraName} onChange={(event) => setExtraName(event.target.value)} placeholder="Nama peserta trial/pengganti" />
              </label>
              </div>
            </div>
            <label className="block text-sm font-semibold text-primary">
              Catatan / berita acara
              <textarea className="mt-2 min-h-28 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-primary" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-primary">
              Dokumentasi foto
              <span className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-border bg-surface-container-low px-3 text-sm text-muted transition hover:border-primary hover:bg-white">
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">upload</span>
                  Upload dokumentasi sesi
                </span>
                <span className="text-xs font-bold text-primary">Pilih foto</span>
              </span>
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleSessionPhotoUpload(event.target.files?.[0] || null)} />
              {isUploading ? <span className="mt-2 block text-xs text-muted">Mengupload...</span> : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {photoUrls.split("\n").map((value) => value.trim()).filter(Boolean).map((url) => (
                  <div key={url} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                    <a className="truncate text-xs font-bold text-secondary" href={url} target="_blank" rel="noreferrer">Foto sesi</a>
                    <button className="rounded border border-border px-2 py-1 text-xs font-bold text-primary" type="button" onClick={() => removePhoto(url)}>Hapus</button>
                  </div>
                ))}
              </div>
            </label>

            <div className="border-t border-border pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="label-caps text-secondary">Daftar Hadir</p>
                  <h3 className="font-heading text-lg font-bold text-primary">Peserta Latihan</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary" type="button" onClick={() => setAllAttendance("present")}>Semua Hadir</button>
                  <button className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary" type="button" onClick={() => setAllAttendance("absent")}>Semua Tidak Hadir</button>
                </div>
              </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                    <th className="min-w-56 pb-3">Peserta</th>
                    <th className="w-24 pb-3 text-center">Hadir</th>
                    <th className="w-24 pb-3 text-center">Izin</th>
                    <th className="w-28 pb-3 text-center">Tidak Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selected.attendances || []).map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="py-3 font-bold text-primary">
                        {attendance.student?.name || attendance.participant_name}
                        {attendance.is_extra_participant ? <span className="ml-2 rounded bg-secondary/10 px-2 py-0.5 text-xs text-secondary">Tambahan</span> : null}
                      </td>
                      {(["present", "excused", "absent"] as TrainingAttendance["status"][]).map((status) => {
                        const active = (attendanceEdits[attendance.id] || attendance.status) === status;
                        return (
                          <td key={status} className="py-3 text-center">
                            <button
                              className={`inline-flex h-9 min-w-16 items-center justify-center rounded-md border px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-primary bg-primary text-white" : "border-border bg-white text-primary hover:bg-surface-container"}`}
                              disabled={attendance.is_extra_participant}
                              type="button"
                              aria-label={`${attendanceLabels[status]} - ${attendance.student?.name || attendance.participant_name}`}
                              onClick={() => setAttendanceStatus(attendance.id, status)}
                            >
                              {attendanceLabels[status]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary disabled:bg-muted" disabled={isSaving} onClick={() => handleSaveAttendance("draft")} type="button">
                Simpan Draft
              </button>
              <button className="h-11 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} onClick={() => handleSaveAttendance("completed")} type="button">
                Selesaikan Absensi
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
