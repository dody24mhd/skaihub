"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EvaluationAspect,
  EvaluationPeriod,
  Student,
  StudentEvaluationScore,
  TrainingClass,
  createAkademiEvaluationPeriodAspect,
  createAkademiEvaluationPeriod,
  deleteAkademiEvaluationAspect,
  downloadAkademiEvaluationExport,
  getAkademiClasses,
  getAkademiEvaluationPeriodAspects,
  getAkademiEvaluationPeriods,
  getAkademiEvaluationScores,
  getAkademiStudents,
  updateAkademiEvaluationAspect,
  updateAkademiEvaluationPeriod,
  upsertAkademiEvaluationScores,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

const statusLabels: Record<EvaluationPeriod["status"], string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Arsip",
};

const statusStyles: Record<EvaluationPeriod["status"], string> = {
  draft: "bg-surface-container text-muted",
  active: "bg-success/10 text-success",
  closed: "bg-primary/10 text-primary",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonthDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

type AcademyEvaluationsManagerProps = {
  mode?: "input" | "settings";
};

export default function AcademyEvaluationsManager({ mode = "input" }: AcademyEvaluationsManagerProps) {
  const tokenRef = useRef("");
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [aspects, setAspects] = useState<EvaluationAspect[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<StudentEvaluationScore[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isPeriodDetailOpen, setIsPeriodDetailOpen] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [periodName, setPeriodName] = useState("Periode Penilaian Baru");
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(nextMonthDate());
  const [aspectName, setAspectName] = useState("");
  const [aspectCategory, setAspectCategory] = useState("Teknik");
  const [editingAspectId, setEditingAspectId] = useState<number | null>(null);
  const [editingAspectName, setEditingAspectName] = useState("");
  const [editingAspectCategory, setEditingAspectCategory] = useState("");
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPeriod = useMemo(
    () => periods.find((period) => String(period.id) === selectedPeriodId) || null,
    [periods, selectedPeriodId],
  );
  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const activeAspects = useMemo(() => aspects.filter((aspect) => aspect.is_active), [aspects]);
  const activePeriod = useMemo(() => periods.find((period) => period.status === "active") || null, [periods]);
  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students;
    return students.filter((student) => String(student.primary_class_id || "") === classFilter);
  }, [classFilter, students]);

  const averageScore = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(scores.reduce((total, item) => total + Number(item.score), 0) / scores.length);
  }, [scores]);

  const classSummaries = useMemo(() => classes.map((item) => {
    const classStudents = students.filter((student) => student.primary_class_id === item.id);
    const classScores = scores.filter((score) => score.class_id === item.id || score.student?.primary_class_id === item.id);
    const average = classScores.length
      ? Math.round(classScores.reduce((total, score) => total + Number(score.score), 0) / classScores.length)
      : 0;

    return {
      classItem: item,
      studentCount: classStudents.length,
      scoreCount: classScores.length,
      expectedScoreCount: classStudents.length * activeAspects.length,
      average,
    };
  }), [activeAspects.length, classes, scores, students]);

  const loadBaseData = useCallback(async (activeToken: string) => {
    const [periodData, classData, studentData] = await Promise.all([
      getAkademiEvaluationPeriods(activeToken),
      getAkademiClasses(activeToken),
      getAkademiStudents(activeToken),
    ]);

    setPeriods(periodData.data);
    setClasses(classData.data);
    setStudents(studentData.data.data.filter((student) => student.status === "active"));

    const defaultPeriod = periodData.data.find((period) => period.status === "active") || periodData.data[0];
    if (defaultPeriod) {
      setSelectedPeriodId((current) => current || String(defaultPeriod.id));
    }
  }, []);

  const loadAspects = useCallback(async (activeToken: string, periodId: string) => {
    if (!periodId) {
      setAspects([]);
      return;
    }

    const aspectData = await getAkademiEvaluationPeriodAspects(activeToken, periodId);
    setAspects(aspectData.data);
  }, []);

  function syncScoreDrafts(nextItems: StudentEvaluationScore[]) {
    const nextScores: Record<string, string> = {};
    const nextNotes: Record<number, string> = {};

    nextItems.forEach((score) => {
      nextScores[`${score.student_id}:${score.evaluation_aspect_id}`] = String(Number(score.score));
      if (score.notes && !nextNotes[score.student_id]) {
        nextNotes[score.student_id] = score.notes;
      }
    });

    setDraftScores(nextScores);
    setDraftNotes(nextNotes);
  }

  const loadScores = useCallback(async (activeToken: string, periodId: string, activeClassFilter = classFilter) => {
    if (!periodId) {
      setScores([]);
      syncScoreDrafts([]);
      return;
    }

    const scoreData = await getAkademiEvaluationScores(activeToken, Number(periodId), {
      class_id: activeClassFilter === "all" ? "all" : Number(activeClassFilter),
    });
    setScores(scoreData.data);
    syncScoreDrafts(scoreData.data);
  }, [classFilter]);

  async function refreshAll() {
    await loadBaseData(tokenRef.current);
    await loadAspects(tokenRef.current, selectedPeriodId);
    await loadScores(tokenRef.current, selectedPeriodId);
  }

  async function handleExport() {
    if (!selectedPeriodId) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await downloadAkademiEvaluationExport(tokenRef.current, Number(selectedPeriodId), {
        class_id: classFilter === "all" ? "all" : Number(classFilter),
      });
      setMessage("Export rekap penilaian diproses.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal export penilaian.");
    } finally {
      setIsSaving(false);
    }
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat penilaian."))
        .finally(() => setIsLoading(false));
    });
  }, [loadBaseData]);

  useEffect(() => {
    if (!tokenRef.current || !selectedPeriodId) return;

    setIsSaving(true);
    Promise.all([
      loadAspects(tokenRef.current, selectedPeriodId),
      loadScores(tokenRef.current, selectedPeriodId),
    ])
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat nilai penilaian."))
      .finally(() => setIsSaving(false));
  }, [classFilter, loadAspects, loadScores, selectedPeriodId]);

  async function handleCreatePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmed = window.confirm("Apakah anda yakin mau membuat periode baru?");
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await createAkademiEvaluationPeriod(tokenRef.current, {
        name: periodName,
        starts_at: periodStart,
        ends_at: periodEnd,
        status: "draft",
      });
      await loadBaseData(tokenRef.current);
      setSelectedPeriodId(String(result.evaluation_period.id));
      setIsPeriodDetailOpen(true);
      setMessage("Periode penilaian dibuat.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membuat periode.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateAspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPeriodId) {
      setError("Pilih periode sebelum menambah variabel.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await createAkademiEvaluationPeriodAspect(tokenRef.current, selectedPeriodId, {
        name: aspectName,
        category: aspectCategory || null,
        sort_order: aspects.length + 1,
      });
      await loadAspects(tokenRef.current, selectedPeriodId);
      setAspectName("");
      setMessage(`Aspek ${result.evaluation_aspect.name} ditambahkan.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menambah aspek.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditAspect(aspect: EvaluationAspect) {
    setEditingAspectId(aspect.id);
    setEditingAspectName(aspect.name);
    setEditingAspectCategory(aspect.category || "");
    setError("");
    setMessage("");
  }

  function cancelEditAspect() {
    setEditingAspectId(null);
    setEditingAspectName("");
    setEditingAspectCategory("");
  }

  async function handleUpdateAspect(aspect: EvaluationAspect) {
    const nextName = editingAspectName.trim();
    if (!nextName) {
      setError("Nama variabel wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updateAkademiEvaluationAspect(tokenRef.current, aspect.id, {
        name: nextName,
        category: editingAspectCategory.trim() || null,
      });
      await loadAspects(tokenRef.current, selectedPeriodId);
      cancelEditAspect();
      setMessage(`Variabel ${result.evaluation_aspect.name} diperbarui.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengubah variabel.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAspect(aspect: EvaluationAspect) {
    const confirmed = window.confirm(`Apakah kamu yakin mau hapus variabel ${aspect.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteAkademiEvaluationAspect(tokenRef.current, aspect.id);
      await loadAspects(tokenRef.current, selectedPeriodId);
      if (editingAspectId === aspect.id) {
        cancelEditAspect();
      }
      setMessage(`Variabel ${aspect.name} dihapus.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus variabel.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdatePeriodStatus(period: EvaluationPeriod, status: EvaluationPeriod["status"]) {
    const actionLabel = status === "active" ? "aktifkan" : status === "closed" ? "arsipkan" : "ubah ke draft";
    const confirmed = window.confirm(`Yakin ${actionLabel} periode ${period.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await updateAkademiEvaluationPeriod(tokenRef.current, period.id, { status });
      await refreshAll();
      setMessage(`Status periode menjadi ${statusLabels[status].toLowerCase()}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengubah status periode.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveScoreGrid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPeriodId) return;

    const payloadScores = filteredStudents.flatMap((student) => activeAspects
      .map((aspect) => {
        const value = draftScores[`${student.id}:${aspect.id}`];
        if (!value) return null;

        return {
          student_id: student.id,
          evaluation_aspect_id: aspect.id,
          class_id: student.primary_class_id || null,
          score: Number(value),
          notes: draftNotes[student.id] || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)));

    if (!payloadScores.length) {
      setError("Isi minimal satu nilai sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await upsertAkademiEvaluationScores(tokenRef.current, Number(selectedPeriodId), {
        scores: payloadScores,
      });
      await loadScores(tokenRef.current, selectedPeriodId);
      setMessage("Nilai penilaian tersimpan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan nilai.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat penilaian siswa...</p>;

  if (mode === "settings") {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="card-soft rounded-lg bg-white p-5">
              <p className="label-caps text-secondary">Periode</p>
              <p className="mt-2 text-2xl font-black text-primary">{periods.length}</p>
              <p className="text-sm text-muted">Periode penilaian tersimpan</p>
            </article>
            <article className="card-soft rounded-lg bg-white p-5">
              <p className="label-caps text-secondary">Periode Aktif</p>
              <p className="mt-2 text-lg font-black text-primary">{activePeriod?.name || "-"}</p>
              <p className="text-sm text-muted">Hanya satu periode bisa aktif</p>
            </article>
          </div>

          <section className="card-soft rounded-lg bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="label-caps text-secondary">Periode Penilaian</p>
                <h2 className="font-heading text-xl font-bold text-primary">{isPeriodDetailOpen ? selectedPeriod?.name || "Detail Periode" : "Daftar Periode"}</h2>
              </div>
              {isPeriodDetailOpen ? (
                <button className="h-10 rounded-md border border-border px-4 text-sm font-bold text-primary" type="button" onClick={() => setIsPeriodDetailOpen(false)}>
                  Kembali ke Daftar Periode
                </button>
              ) : null}
            </div>

            {isPeriodDetailOpen && selectedPeriod ? (
              <div className="mt-4 rounded-md border border-border bg-surface-container-low p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-primary">{selectedPeriod.name}</p>
                    <p className="mt-1 text-sm text-muted">{shortDate(selectedPeriod.starts_at)} sampai {shortDate(selectedPeriod.ends_at)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selectedPeriod.status]}`}>{statusLabels[selectedPeriod.status]}</span>
                </div>
                <p className="mt-4 text-xs text-muted">
                  {selectedPeriod.status === "active"
                    ? "Periode aktif bisa dipakai untuk input nilai."
                    : selectedPeriod.status === "closed"
                      ? "Periode sudah ditutup dan nilai terkunci."
                      : "Aktifkan periode setelah variabel penilaian siap."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPeriod.status !== "active" ? (
                    <button className="h-9 rounded-md bg-primary px-3 text-xs font-bold text-white disabled:bg-muted" disabled={isSaving} onClick={() => handleUpdatePeriodStatus(selectedPeriod, "active")} type="button">
                      Aktifkan
                    </button>
                  ) : null}
                  {selectedPeriod.status !== "closed" ? (
                    <button className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary disabled:bg-muted" disabled={isSaving} onClick={() => handleUpdatePeriodStatus(selectedPeriod, "closed")} type="button">
                      Arsipkan
                    </button>
                  ) : null}
                </div>
              </div>
            ) : !periods.length ? (
              <p className="mt-4 text-sm text-muted">Belum ada periode penilaian.</p>
            ) : null}

            {!isPeriodDetailOpen ? (
              <div className="mt-5 divide-y divide-border">
                {periods.map((period) => (
                  <div key={period.id} className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between ${period.status === "active" ? "rounded-md bg-success/5 px-3" : ""}`}>
                    <button type="button" onClick={() => setSelectedPeriodId(String(period.id))} className="min-w-0 flex-1 text-left">
                      <p className="font-bold text-primary">{period.name}</p>
                      <p className="text-xs text-muted">
                        {shortDate(period.starts_at)} sampai {shortDate(period.ends_at)} · {period.aspects_count || 0} variabel
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyles[period.status]}`}>{statusLabels[period.status]}</span>
                      {period.status !== "active" ? (
                        <button className="h-9 rounded-md bg-primary px-3 text-xs font-bold text-white disabled:bg-muted" disabled={isSaving} onClick={() => handleUpdatePeriodStatus(period, "active")} type="button">
                          Aktifkan
                        </button>
                      ) : (
                        <button className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary disabled:bg-muted" disabled={isSaving} onClick={() => handleUpdatePeriodStatus(period, "closed")} type="button">
                          Arsipkan
                        </button>
                      )}
                      <button
                        className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary hover:border-primary"
                        type="button"
                        onClick={() => {
                          setSelectedPeriodId(String(period.id));
                          setIsPeriodDetailOpen(true);
                        }}
                      >
                        Kelola -&gt;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedPeriod ? (
              <p className="mt-4 text-sm text-muted">Pilih periode terlebih dahulu.</p>
            ) : (
              <div className="mt-5 rounded-md border border-border bg-white p-4">
                <p className="label-caps text-secondary">Variabel Penilaian</p>
                <h3 className="font-heading text-lg font-bold text-primary">Variabel Periode Ini</h3>
                <div className="mt-4 divide-y divide-border">
                  {aspects.map((aspect) => (
                    <div key={aspect.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                      {editingAspectId === aspect.id ? (
                        <div className="grid flex-1 gap-3 sm:grid-cols-2">
                          <label className="block text-xs font-bold uppercase text-muted">
                            Nama Variabel
                            <input
                              className="mt-2 h-10 w-full rounded-md border border-border px-3 text-sm font-semibold text-primary outline-none focus:border-primary"
                              value={editingAspectName}
                              onChange={(event) => setEditingAspectName(event.target.value)}
                            />
                          </label>
                          <label className="block text-xs font-bold uppercase text-muted">
                            Kategori
                            <input
                              className="mt-2 h-10 w-full rounded-md border border-border px-3 text-sm font-semibold text-primary outline-none focus:border-primary"
                              value={editingAspectCategory}
                              onChange={(event) => setEditingAspectCategory(event.target.value)}
                              placeholder="Tanpa kategori"
                            />
                          </label>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-primary">{aspect.name}</p>
                          <p className="text-xs text-muted">{aspect.category || "Tanpa kategori"}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${aspect.is_active ? "bg-success/10 text-success" : "bg-muted/10 text-muted"}`}>
                          {aspect.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                        {editingAspectId === aspect.id ? (
                          <>
                            <button
                              className="h-9 rounded-md bg-primary px-3 text-xs font-bold text-white disabled:bg-muted"
                              disabled={isSaving}
                              onClick={() => handleUpdateAspect(aspect)}
                              type="button"
                            >
                              Simpan
                            </button>
                            <button
                              className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary disabled:bg-muted"
                              disabled={isSaving}
                              onClick={cancelEditAspect}
                              type="button"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="h-9 rounded-md border border-border px-3 text-xs font-bold text-primary hover:border-primary disabled:bg-muted"
                              disabled={isSaving}
                              onClick={() => startEditAspect(aspect)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary hover:bg-secondary/5 disabled:bg-muted"
                              disabled={isSaving}
                              onClick={() => handleDeleteAspect(aspect)}
                              type="button"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {!aspects.length ? <p className="py-4 text-sm text-muted">Belum ada variabel untuk periode ini.</p> : null}
                </div>
              </div>
            )}

            {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
            {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}
          </section>
        </section>

        <aside className="space-y-6">
          {!isPeriodDetailOpen ? (
            <section className="card-soft rounded-lg bg-white p-5">
              <p className="label-caps text-secondary">Tambah</p>
              <h2 className="font-heading text-lg font-bold text-primary">Periode Penilaian</h2>
              <form className="mt-4 space-y-4" onSubmit={handleCreatePeriod}>
                <label className="block text-sm font-semibold text-primary">
                  Nama periode
                  <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={periodName} onChange={(event) => setPeriodName(event.target.value)} required />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-primary">
                    Mulai
                    <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required />
                  </label>
                  <label className="block text-sm font-semibold text-primary">
                    Selesai
                    <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required />
                  </label>
                </div>
                <p className="rounded-md bg-surface-container-low p-3 text-xs font-semibold text-muted">
                  Periode baru dibuat sebagai Draft. Aktifkan dari daftar setelah variabel penilaian siap.
                </p>
                <button className="h-11 w-full rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">Buat Periode</button>
              </form>
            </section>
          ) : (
            <section className="card-soft rounded-lg bg-white p-5">
              <p className="label-caps text-secondary">Tambah</p>
              <h2 className="font-heading text-lg font-bold text-primary">Variabel Penilaian</h2>
              <form className="mt-4 space-y-4" onSubmit={handleCreateAspect}>
                <label className="block text-sm font-semibold text-primary">
                  Nama aspek
                  <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={aspectName} onChange={(event) => setAspectName(event.target.value)} placeholder="Contoh: Teknik dasar" required />
                </label>
                <label className="block text-sm font-semibold text-primary">
                  Kategori
                  <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm" value={aspectCategory} onChange={(event) => setAspectCategory(event.target.value)} />
                </label>
                <button className="h-11 w-full rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving || !selectedPeriodId} type="submit">Tambah Variabel</button>
              </form>
            </section>
          )}
        </aside>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Periode Aktif</p>
          <p className="mt-2 text-lg font-black text-primary">{selectedPeriod?.name || "-"}</p>
          <p className="text-sm text-muted">{selectedPeriod ? `${shortDate(selectedPeriod.starts_at)} - ${shortDate(selectedPeriod.ends_at)}` : "Belum ada periode"}</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Rata-rata</p>
          <p className="mt-2 text-2xl font-black text-secondary">{averageScore || "-"}</p>
          <p className="text-sm text-muted">{scores.length} nilai dalam filter ini</p>
        </article>
      </div>

      <form className="card-soft rounded-lg bg-white p-5" onSubmit={handleSaveScoreGrid}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Input Raport</p>
            <h2 className="font-heading text-xl font-bold text-primary">{selectedClass ? selectedClass.name : "Daftar Kelas"}</h2>
            <p className="mt-2 text-sm text-muted">
              {selectedClass
                ? "Isi nilai langsung di tabel. Kolom nilai mengikuti variabel aktif dari Format Penilaian."
                : "Pilih kelas terlebih dahulu untuk masuk ke ruang input nilai."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[560px]">
            <select className="h-10 rounded-md border border-border px-3 text-sm" value={selectedPeriodId} onChange={(event) => setSelectedPeriodId(event.target.value)}>
              <option value="">Pilih periode</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
            <button className="h-10 rounded-md border border-border px-3 text-sm font-bold text-primary" onClick={() => refreshAll()} type="button" disabled={isSaving}>
              Refresh
            </button>
            <button className="h-10 rounded-md border border-border px-3 text-sm font-bold text-primary" onClick={handleExport} type="button" disabled={isSaving || !selectedPeriodId}>
              Export
            </button>
          </div>
        </div>

        {selectedPeriod ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{statusLabels[selectedPeriod.status]}</span>
            <span>{shortDate(selectedPeriod.starts_at)} sampai {shortDate(selectedPeriod.ends_at)}</span>
          </div>
        ) : null}

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        {!selectedPeriodId || !activeAspects.length ? (
          <div className="mt-5 rounded-md border border-border bg-surface-container-low p-4 text-sm text-muted">
            {!selectedPeriodId ? "Pilih periode penilaian terlebih dahulu." : "Variabel penilaian belum disiapkan di Format Penilaian."}
          </div>
        ) : !selectedClass ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                  <th className="pb-3 pr-4">Kelas / Unit</th>
                  <th className="w-32 pb-3 pr-4">Siswa</th>
                  <th className="w-40 pb-3 pr-4">Nilai Terisi</th>
                  <th className="w-32 pb-3 pr-4">Rata-rata</th>
                  <th className="w-28 pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classSummaries.map(({ classItem, studentCount, scoreCount, expectedScoreCount, average }) => (
                  <tr key={classItem.id}>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-primary">{classItem.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        Target {classItem.target_sessions_per_month || 0}x latihan/bulan
                      </p>
                    </td>
                    <td className="py-4 pr-4 font-semibold text-primary">{studentCount} siswa</td>
                    <td className="py-4 pr-4 text-muted">
                      <span className="font-semibold text-primary">{scoreCount}</span>
                      <span> / {expectedScoreCount || 0}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`font-black ${average ? "text-secondary" : "text-muted"}`}>{average || "-"}</span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-bold text-primary hover:border-primary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted"
                        type="button"
                        disabled={!studentCount}
                        onClick={() => {
                          setSelectedClassId(String(classItem.id));
                          setClassFilter(String(classItem.id));
                        }}
                        title={`Masuk ke penilaian ${classItem.name}`}
                      >
                        <span>Masuk</span>
                        <span aria-hidden="true">-&gt;</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!classSummaries.length ? (
                  <tr>
                    <td className="py-8 text-sm text-muted" colSpan={5}>Belum ada kelas. Siapkan kelas/unit terlebih dahulu.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-primary">{selectedClass.name}</p>
                <p className="mt-1 text-xs text-muted">{filteredStudents.length} siswa, {activeAspects.length} variabel penilaian</p>
              </div>
              <button
                className="h-10 rounded-md border border-border bg-white px-4 text-sm font-bold text-primary"
                type="button"
                onClick={() => {
                  setSelectedClassId("");
                  setClassFilter("all");
                }}
              >
                Kembali ke Daftar Kelas
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                    <th className="sticky left-0 z-10 w-56 bg-white pb-3 pr-4">Siswa</th>
                    <th className="w-44 pb-3 pr-4">Kelas</th>
                    {activeAspects.map((aspect) => (
                      <th key={aspect.id} className="w-32 pb-3 pr-3">{aspect.name}</th>
                    ))}
                    <th className="w-64 pb-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="sticky left-0 z-10 bg-white py-3 pr-4 font-bold text-primary">{student.name}</td>
                      <td className="py-3 pr-4 text-muted">{student.primary_class?.name || "-"}</td>
                      {activeAspects.map((aspect) => {
                        const key = `${student.id}:${aspect.id}`;

                        return (
                          <td key={aspect.id} className="py-3 pr-3">
                            <input
                              className="h-10 w-24 rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
                              type="number"
                              min="1"
                              max="100"
                              value={draftScores[key] || ""}
                              onChange={(event) => setDraftScores((current) => ({ ...current, [key]: event.target.value }))}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                      <td className="py-3">
                        <input
                          className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
                          value={draftNotes[student.id] || ""}
                          onChange={(event) => setDraftNotes((current) => ({ ...current, [student.id]: event.target.value }))}
                          placeholder="Opsional"
                        />
                      </td>
                    </tr>
                  ))}
                  {!filteredStudents.length ? (
                    <tr>
                      <td className="py-8 text-sm text-muted" colSpan={activeAspects.length + 3}>Belum ada siswa aktif dalam filter ini.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">{filteredStudents.length} siswa ditampilkan, {activeAspects.length} variabel penilaian.</p>
              <button className="h-11 rounded-md bg-primary px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted" disabled={isSaving || !selectedPeriodId || selectedPeriod?.status === "closed"} type="submit">
                Simpan Semua Nilai
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
