"use client";

import EvaluationScoringView from "./evaluation/evaluation-scoring-view";
import EvaluationSettingsView from "./evaluation/evaluation-settings-view";
import { useEvaluationData } from "./evaluation/use-evaluation-data";

type AcademyEvaluationsManagerProps = {
  mode?: "input" | "settings";
};

export default function AcademyEvaluationsManager({
  mode = "input",
}: AcademyEvaluationsManagerProps) {
  const data = useEvaluationData();

  if (data.isLoading) {
    return <p className="text-sm text-muted">Memuat penilaian siswa...</p>;
  }

  if (mode === "settings") {
    return (
      <EvaluationSettingsView
        periods={data.periods}
        selectedPeriod={data.selectedPeriod}
        aspects={data.aspects}
        activePeriod={data.activePeriod}
        isPeriodDetailOpen={data.isPeriodDetailOpen}
        setIsPeriodDetailOpen={data.setIsPeriodDetailOpen}
        selectedPeriodId={data.selectedPeriodId}
        setSelectedPeriodId={data.setSelectedPeriodId}
        periodName={data.periodName}
        setPeriodName={data.setPeriodName}
        periodStart={data.periodStart}
        setPeriodStart={data.setPeriodStart}
        periodEnd={data.periodEnd}
        setPeriodEnd={data.setPeriodEnd}
        aspectName={data.aspectName}
        setAspectName={data.setAspectName}
        aspectCategory={data.aspectCategory}
        setAspectCategory={data.setAspectCategory}
        editingAspectId={data.editingAspectId}
        editingAspectName={data.editingAspectName}
        setEditingAspectName={data.setEditingAspectName}
        editingAspectCategory={data.editingAspectCategory}
        setEditingAspectCategory={data.setEditingAspectCategory}
        isSaving={data.isSaving}
        message={data.message}
        error={data.error}
        onUpdatePeriodStatus={data.handleUpdatePeriodStatus}
        onCreatePeriod={data.handleCreatePeriod}
        onCreateAspect={data.handleCreateAspect}
        onStartEditAspect={data.startEditAspect}
        onCancelEditAspect={data.cancelEditAspect}
        onUpdateAspect={data.handleUpdateAspect}
        onDeleteAspect={data.handleDeleteAspect}
      />
    );
  }

  return (
    <EvaluationScoringView
      periods={data.periods}
      selectedPeriod={data.selectedPeriod}
      selectedPeriodId={data.selectedPeriodId}
      setSelectedPeriodId={data.setSelectedPeriodId}
      selectedClass={data.selectedClass}
      selectedClassId={data.selectedClassId}
      setSelectedClassId={data.setSelectedClassId}
      setClassFilter={data.setClassFilter}
      activeAspects={data.activeAspects}
      filteredStudents={data.filteredStudents}
      classSummaries={data.classSummaries}
      averageScore={data.averageScore}
      scores={data.scores}
      draftScores={data.draftScores}
      setDraftScores={data.setDraftScores}
      draftNotes={data.draftNotes}
      setDraftNotes={data.setDraftNotes}
      isSaving={data.isSaving}
      message={data.message}
      error={data.error}
      onRefresh={data.refreshAll}
      onExport={data.handleExport}
      onSaveScoreGrid={data.handleSaveScoreGrid}
    />
  );
}
