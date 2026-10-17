"use client";

import { FormEvent } from "react";
import {
  EvaluationAspect,
  EvaluationPeriod,
  Student,
  StudentEvaluationScore,
  TrainingClass,
} from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";
import EvaluationMobileScorer from "./evaluation-mobile-scorer";
import {
  getScoreLabel,
  getScoreLabelStyle,
  shortDate,
  statusLabels,
} from "./evaluation-types";
import StatusMessage from "../ui/status-message";

export type EvaluationScoringViewProps = {
  periods: EvaluationPeriod[];
  selectedPeriod: EvaluationPeriod | null;
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  selectedClass: TrainingClass | null;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  setClassFilter: (filter: string) => void;
  activeAspects: EvaluationAspect[];
  filteredStudents: Student[];
  classSummaries: {
    classItem: TrainingClass;
    studentCount: number;
    scoreCount: number;
    expectedScoreCount: number;
    average: number;
  }[];
  averageScore: number;
  scores: StudentEvaluationScore[];
  draftScores: Record<string, string>;
  setDraftScores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  draftNotes: Record<number, string>;
  setDraftNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  isSaving: boolean;
  message: string;
  error: string;
  onRefresh: () => Promise<void>;
  onExport: () => Promise<void>;
  onSaveScoreGrid: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function EvaluationScoringView({
  periods,
  selectedPeriod,
  selectedPeriodId,
  setSelectedPeriodId,
  selectedClass,
  setSelectedClassId,
  setClassFilter,
  activeAspects,
  filteredStudents,
  classSummaries,
  averageScore,
  scores,
  draftScores,
  setDraftScores,
  draftNotes,
  setDraftNotes,
  isSaving,
  message,
  error,
  onRefresh,
  onExport,
  onSaveScoreGrid,
}: EvaluationScoringViewProps) {
  const classColumns: ResponsiveColumn<(typeof classSummaries)[number]>[] = [
    {
      key: "name",
      header: "Kelas / Unit",
      primary: true,
      render: (item) => (
        <div>
          <p className="font-bold text-primary">{item.classItem.name}</p>
          <p className="text-xs text-muted">
            Target {item.classItem.target_sessions_per_month || 0}x latihan/bulan
          </p>
        </div>
      ),
    },
    {
      key: "students",
      header: "Siswa",
      render: (item) => (
        <span className="font-semibold text-primary">{item.studentCount} siswa</span>
      ),
    },
    {
      key: "scores",
      header: "Nilai Terisi",
      render: (item) => (
        <span className="text-muted">
          <span className="font-semibold text-primary">{item.scoreCount}</span> /{" "}
          {item.expectedScoreCount || 0}
        </span>
      ),
    },
    {
      key: "average",
      header: "Rata-rata",
      render: (item) => (
        <span className={`font-black ${item.average ? "text-secondary" : "text-muted"}`}>
          {item.average || "-"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted sm:w-auto"
          type="button"
          disabled={!item.studentCount}
          onClick={() => {
            setSelectedClassId(String(item.classItem.id));
            setClassFilter(String(item.classItem.id));
          }}
          title={`Masuk ke penilaian ${item.classItem.name}`}
        >
          <span>Masuk</span>
          <span aria-hidden="true">-&gt;</span>
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Periode Aktif</p>
          <p className="mt-2 text-lg font-black text-primary">{selectedPeriod?.name || "-"}</p>
          <p className="text-sm text-muted">
            {selectedPeriod
              ? `${shortDate(selectedPeriod.starts_at)} - ${shortDate(selectedPeriod.ends_at)}`
              : "Belum ada periode"}
          </p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Rata-rata</p>
          <p className="mt-2 text-2xl font-black text-secondary">{averageScore || "-"}</p>
          <p className="text-sm text-muted">{scores.length} nilai dalam filter ini</p>
        </article>
      </div>

      <form className="card-soft rounded-lg bg-white p-5" onSubmit={onSaveScoreGrid}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Input Raport</p>
            <h2 className="font-heading text-xl font-bold text-primary">
              {selectedClass ? selectedClass.name : "Daftar Kelas"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {selectedClass
                ? "Isi nilai langsung di tabel. Kolom nilai mengikuti variabel aktif dari Format Penilaian."
                : "Pilih kelas terlebih dahulu untuk masuk ke ruang input nilai."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[560px]">
            <select
              className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-primary"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              aria-label="Pilih Periode Penilaian"
            >
              <option value="">Pilih periode</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-bold text-primary transition hover:bg-surface-container"
              onClick={() => onRefresh()}
              type="button"
              disabled={isSaving}
            >
              Refresh
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-bold text-primary transition hover:bg-surface-container disabled:bg-muted"
              onClick={onExport}
              type="button"
              disabled={isSaving || !selectedPeriodId}
            >
              Export
            </button>
          </div>
        </div>

        {selectedPeriod ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
              {statusLabels[selectedPeriod.status]}
            </span>
            <span>
              {shortDate(selectedPeriod.starts_at)} sampai {shortDate(selectedPeriod.ends_at)}
            </span>
          </div>
        ) : null}

        <StatusMessage tone="success" message={message} className="mt-4" />
        <StatusMessage tone="error" message={error} className="mt-4" />

        {!selectedPeriodId || !activeAspects.length ? (
          <div className="mt-5 rounded-md border border-border bg-surface-container-low p-6 text-center text-sm text-muted">
            {!selectedPeriodId
              ? "Pilih periode penilaian terlebih dahulu."
              : "Variabel penilaian belum disiapkan di Format Penilaian."}
          </div>
        ) : !selectedClass ? (
          <div className="mt-5">
            <ResponsiveList
              columns={classColumns}
              rows={classSummaries}
              getRowKey={(item) => item.classItem.id}
              ariaLabel="Daftar Kelas Penilaian"
              emptyState={
                <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
                  Belum ada kelas. Siapkan kelas/unit terlebih dahulu.
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-primary">{selectedClass.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {filteredStudents.length} siswa, {activeAspects.length} variabel penilaian
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-bold text-primary transition hover:bg-surface-container"
                type="button"
                onClick={() => {
                  setSelectedClassId("");
                  setClassFilter("all");
                }}
              >
                &lt;- Kembali ke Daftar Kelas
              </button>
            </div>

            {/* Desktop (md+): Tabel matriks */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                    <th className="sticky left-0 z-10 w-56 bg-white pb-3 pr-4">Siswa</th>
                    <th className="w-44 pb-3 pr-4">Kelas</th>
                    {activeAspects.map((aspect) => (
                      <th key={aspect.id} className="w-32 pb-3 pr-3">
                        {aspect.name}
                      </th>
                    ))}
                    <th className="w-64 pb-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="sticky left-0 z-10 bg-white py-3 pr-4 font-bold text-primary">
                        {student.name}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {student.primary_class?.name || "-"}
                      </td>
                      {activeAspects.map((aspect) => {
                        const key = `${student.id}:${aspect.id}`;
                        const scoreNum = Number(draftScores[key]);

                        return (
                          <td key={aspect.id} className="py-3 pr-3">
                            <div className="space-y-1">
                              <input
                                className="min-h-11 w-24 rounded-md border border-border-strong px-3 text-sm font-semibold outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                                type="number"
                                inputMode="numeric"
                                min="1"
                                max="100"
                                value={draftScores[key] || ""}
                                onChange={(e) =>
                                  setDraftScores((cur) => ({ ...cur, [key]: e.target.value }))
                                }
                                placeholder="-"
                                aria-label={`Nilai ${aspect.name} untuk ${student.name}`}
                              />
                              {draftScores[key] ? (
                                <p className={`text-[11px] ${getScoreLabelStyle(scoreNum)}`}>
                                  {getScoreLabel(scoreNum)}
                                </p>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3">
                        <input
                          className="min-h-11 w-full rounded-md border border-border-strong px-3 text-sm outline-none transition focus:border-primary"
                          value={draftNotes[student.id] || ""}
                          onChange={(e) =>
                            setDraftNotes((cur) => ({ ...cur, [student.id]: e.target.value }))
                          }
                          placeholder="Opsional"
                          aria-label={`Catatan untuk ${student.name}`}
                        />
                      </td>
                    </tr>
                  ))}
                  {!filteredStudents.length ? (
                    <tr>
                      <td
                        className="py-8 text-center text-sm text-muted"
                        colSpan={activeAspects.length + 3}
                      >
                        Belum ada siswa aktif dalam filter ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Mobile (<md): Pola kartu aspek per siswa */}
            <EvaluationMobileScorer
              filteredStudents={filteredStudents}
              selectedClass={selectedClass}
              activeAspects={activeAspects}
              draftScores={draftScores}
              setDraftScores={setDraftScores}
              draftNotes={draftNotes}
              setDraftNotes={setDraftNotes}
            />

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                {filteredStudents.length} siswa, {activeAspects.length} variabel penilaian.
              </p>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted sm:w-auto"
                disabled={
                  isSaving || !selectedPeriodId || selectedPeriod?.status === "closed"
                }
                type="submit"
              >
                Simpan Semua Nilai
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
