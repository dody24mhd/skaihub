"use client";

import { useMemo, useState } from "react";
import { EvaluationAspect, Student, TrainingClass } from "../../_lib/admin-api";
import { SCORE_BANDS, getScoreLabel, getScoreLabelStyle } from "./evaluation-types";

export type EvaluationMobileScorerProps = {
  filteredStudents: Student[];
  selectedClass: TrainingClass;
  activeAspects: EvaluationAspect[];
  draftScores: Record<string, string>;
  setDraftScores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  draftNotes: Record<number, string>;
  setDraftNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
};

export default function EvaluationMobileScorer({
  filteredStudents,
  selectedClass,
  activeAspects,
  draftScores,
  setDraftScores,
  draftNotes,
  setDraftNotes,
}: EvaluationMobileScorerProps) {
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);

  const activeStudent = useMemo(() => {
    if (!filteredStudents.length) return null;
    return (
      filteredStudents[Math.min(activeStudentIndex, filteredStudents.length - 1)] || null
    );
  }, [activeStudentIndex, filteredStudents]);

  if (!filteredStudents.length) {
    return (
      <div className="border-2 border-dashed border-border bg-white p-6 text-center text-sm text-muted md:hidden">
        Belum ada siswa aktif dalam filter ini.
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {/* Pilihan Siswa */}
      <div className="rounded-lg border-2 border-border bg-surface-container-low p-4">
        <label
          htmlFor="mobile-student-picker"
          className="block text-xs font-bold uppercase tracking-wider text-primary"
        >
          Pilih Siswa ({activeStudentIndex + 1}/{filteredStudents.length})
        </label>
        <select
          id="mobile-student-picker"
          className="mt-2 min-h-11 w-full rounded-md border border-border-strong bg-white px-3 text-base font-bold text-primary focus:border-primary"
          value={activeStudentIndex}
          onChange={(e) => setActiveStudentIndex(Number(e.target.value))}
        >
          {filteredStudents.map((st, idx) => (
            <option key={st.id} value={idx}>
              {idx + 1}. {st.name} {st.member_number ? `(${st.member_number})` : ""}
            </option>
          ))}
        </select>

        {/* Tombol Siswa Sebelumnya / Berikutnya */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={activeStudentIndex <= 0}
            onClick={() => setActiveStudentIndex((cur) => Math.max(0, cur - 1))}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-white text-xs font-bold text-primary disabled:opacity-40"
          >
            &lt;- Siswa Sebelumnya
          </button>
          <button
            type="button"
            disabled={activeStudentIndex >= filteredStudents.length - 1}
            onClick={() =>
              setActiveStudentIndex((cur) =>
                Math.min(filteredStudents.length - 1, cur + 1)
              )
            }
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-white text-xs font-bold text-primary disabled:opacity-40"
          >
            Siswa Berikutnya -&gt;
          </button>
        </div>
      </div>

      {/* Kartu Aspek Nilai Siswa Aktif */}
      {activeStudent ? (
        <div className="space-y-4 rounded-lg border-2 border-border bg-white p-4">
          <div className="border-b border-border pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Input Nilai Siswa
            </span>
            <h3 className="font-heading text-lg font-bold text-primary">
              {activeStudent.name}
            </h3>
            <p className="text-xs text-muted">
              {activeStudent.primary_class?.name || selectedClass.name}
            </p>
          </div>

          <ul
            aria-label="Rentang predikat nilai"
            className="grid grid-cols-2 gap-1.5 text-xs text-muted"
          >
            {SCORE_BANDS.map((band) => (
              <li key={band.label} className="rounded-sm bg-surface-container-low px-2 py-1">
                <span className={band.style}>{band.label}</span> {band.min}–{band.max}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            {activeAspects.map((aspect) => {
              const key = `${activeStudent.id}:${aspect.id}`;
              const rawVal = draftScores[key] || "";
              const scoreNum = Number(rawVal);
              const scoreLabel = getScoreLabel(scoreNum);
              const scoreStyle = getScoreLabelStyle(scoreNum);

              return (
                <div
                  key={aspect.id}
                  className="rounded-md border border-border bg-surface-container-low p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm font-bold text-primary">
                      {aspect.name}
                    </span>
                    {aspect.category ? (
                      <span className="rounded-sm bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-muted">
                        {aspect.category}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label htmlFor={`mobile-score-${key}`} className="sr-only">
                        Nilai {aspect.name}
                      </label>
                      <input
                        id={`mobile-score-${key}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="100"
                        placeholder="1-100"
                        value={rawVal}
                        onChange={(e) =>
                          setDraftScores((cur) => ({
                            ...cur,
                            [key]: e.target.value,
                          }))
                        }
                        className="min-h-11 w-full rounded-md border border-border-strong bg-white px-3.5 text-base font-bold text-primary placeholder:text-muted/80 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="min-w-28 shrink-0 text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                        Predikat
                      </span>
                      <span
                        data-testid="score-label"
                        className={`text-sm ${scoreStyle}`}
                      >
                        {scoreLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <label
              htmlFor={`mobile-notes-${activeStudent.id}`}
              className="block text-xs font-bold uppercase tracking-wider text-primary"
            >
              Catatan Evaluasi (Opsional)
            </label>
            <textarea
              id={`mobile-notes-${activeStudent.id}`}
              rows={2}
              value={draftNotes[activeStudent.id] || ""}
              onChange={(e) =>
                setDraftNotes((cur) => ({
                  ...cur,
                  [activeStudent.id]: e.target.value,
                }))
              }
              placeholder="Catatan perkembangan atau rekomendasi"
              className="mt-1.5 min-h-11 w-full rounded-md border border-border-strong bg-white p-3 text-sm text-primary placeholder:text-muted/80 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
