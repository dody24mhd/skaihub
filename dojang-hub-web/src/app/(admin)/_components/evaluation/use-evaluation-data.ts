"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EvaluationAspect,
  EvaluationPeriod,
  Student,
  StudentEvaluationScore,
  TrainingClass,
  getAkademiClasses,
  getAkademiEvaluationPeriodAspects,
  getAkademiEvaluationPeriods,
  getAkademiEvaluationScores,
  getAkademiStudents,
} from "../../_lib/admin-api";
import {
  submitCreateAspect,
  submitCreatePeriod,
  submitDeleteAspect,
  submitExportScores,
  submitSaveScores,
  submitUpdateAspect,
  submitUpdatePeriodStatus,
} from "./evaluation-handlers";
import { nextMonthDate, today } from "./evaluation-types";

const TOKEN_KEY = "skaihub_admin_token";

export function useEvaluationData() {
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
    () => periods.find((p) => String(p.id) === selectedPeriodId) || null,
    [periods, selectedPeriodId]
  );
  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const activeAspects = useMemo(
    () => aspects.filter((aspect) => aspect.is_active),
    [aspects]
  );
  const activePeriod = useMemo(
    () => periods.find((period) => period.status === "active") || null,
    [periods]
  );
  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students;
    return students.filter((s) => String(s.primary_class_id || "") === classFilter);
  }, [classFilter, students]);

  const averageScore = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(
      scores.reduce((total, item) => total + Number(item.score), 0) / scores.length
    );
  }, [scores]);

  const classSummaries = useMemo(
    () =>
      classes.map((item) => {
        const classStudents = students.filter((s) => s.primary_class_id === item.id);
        const classScores = scores.filter(
          (sc) => sc.class_id === item.id || sc.student?.primary_class_id === item.id
        );
        const average = classScores.length
          ? Math.round(
              classScores.reduce((total, sc) => total + Number(sc.score), 0) / classScores.length
            )
          : 0;

        return {
          classItem: item,
          studentCount: classStudents.length,
          scoreCount: classScores.length,
          expectedScoreCount: classStudents.length * activeAspects.length,
          average,
        };
      }),
    [activeAspects.length, classes, scores, students]
  );

  const loadBaseData = useCallback(async (activeToken: string) => {
    const [periodData, classData, studentData] = await Promise.all([
      getAkademiEvaluationPeriods(activeToken),
      getAkademiClasses(activeToken),
      getAkademiStudents(activeToken),
    ]);

    setPeriods(periodData.data);
    setClasses(classData.data);
    setStudents(studentData.data.data.filter((student) => student.status === "active"));

    const defaultPeriod =
      periodData.data.find((period) => period.status === "active") || periodData.data[0];
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

  const loadScores = useCallback(
    async (activeToken: string, periodId: string, activeClassFilter = classFilter) => {
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
    },
    [classFilter]
  );

  async function refreshAll() {
    await loadBaseData(tokenRef.current);
    await loadAspects(tokenRef.current, selectedPeriodId);
    await loadScores(tokenRef.current, selectedPeriodId);
  }

  async function handleExport() {
    await submitExportScores({
      token: tokenRef.current,
      selectedPeriodId,
      classFilter,
      setIsSaving,
      setError,
      setMessage,
    });
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
          setError(caught instanceof Error ? caught.message : "Gagal memuat penilaian.")
        )
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
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Gagal memuat nilai penilaian.")
      )
      .finally(() => setIsSaving(false));
  }, [classFilter, loadAspects, loadScores, selectedPeriodId]);

  async function handleCreatePeriod(event: FormEvent<HTMLFormElement>) {
    await submitCreatePeriod(event, {
      token: tokenRef.current,
      periodName,
      periodStart,
      periodEnd,
      setIsSaving,
      setError,
      setMessage,
      loadBaseData,
      setSelectedPeriodId,
      setIsPeriodDetailOpen,
      refreshAll,
    });
  }

  async function handleUpdatePeriodStatus(
    period: EvaluationPeriod,
    status: EvaluationPeriod["status"]
  ) {
    await submitUpdatePeriodStatus(period, status, {
      token: tokenRef.current,
      setIsSaving,
      setError,
      setMessage,
      refreshAll,
    });
  }

  async function handleCreateAspect(event: FormEvent<HTMLFormElement>) {
    await submitCreateAspect(event, {
      token: tokenRef.current,
      selectedPeriodId,
      aspectName,
      aspectCategory,
      aspectsCount: aspects.length,
      setIsSaving,
      setError,
      setMessage,
      loadAspects,
      setAspectName,
    });
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
    await submitUpdateAspect(aspect, editingAspectName, editingAspectCategory, {
      token: tokenRef.current,
      selectedPeriodId,
      setIsSaving,
      setError,
      setMessage,
      loadAspects,
      onDone: cancelEditAspect,
    });
  }

  async function handleDeleteAspect(aspect: EvaluationAspect) {
    await submitDeleteAspect(aspect, {
      token: tokenRef.current,
      selectedPeriodId,
      setIsSaving,
      setError,
      setMessage,
      loadAspects,
      onDone: () => {
        if (editingAspectId === aspect.id) cancelEditAspect();
      },
    });
  }

  async function handleSaveScoreGrid(event: FormEvent<HTMLFormElement>) {
    await submitSaveScores(event, {
      token: tokenRef.current,
      selectedPeriodId,
      filteredStudents,
      activeAspects,
      draftScores,
      draftNotes,
      setIsSaving,
      setError,
      setMessage,
      loadScores,
    });
  }

  return {
    periods,
    selectedPeriod,
    aspects,
    activePeriod,
    classes,
    students,
    scores,
    selectedPeriodId,
    setSelectedPeriodId,
    selectedClass,
    selectedClassId,
    setSelectedClassId,
    isPeriodDetailOpen,
    setIsPeriodDetailOpen,
    classFilter,
    setClassFilter,
    periodName,
    setPeriodName,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    aspectName,
    setAspectName,
    aspectCategory,
    setAspectCategory,
    editingAspectId,
    editingAspectName,
    setEditingAspectName,
    editingAspectCategory,
    setEditingAspectCategory,
    draftScores,
    setDraftScores,
    draftNotes,
    setDraftNotes,
    isLoading,
    isSaving,
    message,
    error,
    activeAspects,
    filteredStudents,
    averageScore,
    classSummaries,
    refreshAll,
    handleExport,
    handleCreatePeriod,
    handleCreateAspect,
    startEditAspect,
    cancelEditAspect,
    handleUpdateAspect,
    handleDeleteAspect,
    handleUpdatePeriodStatus,
    handleSaveScoreGrid,
  };
}
