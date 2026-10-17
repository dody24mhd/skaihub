"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EvaluationPeriod, getAkademiEvaluationPeriods } from "../../_lib/admin-api";
import { statusLabels } from "../evaluation/evaluation-types";
import Icon from "../ui/icon";

function defaultPeriodId(periods: EvaluationPeriod[]): string {
  const period = periods.find((item) => item.status === "active") ?? periods[0];
  return period ? String(period.id) : "";
}

export default function StudentReportLink({ token, studentId }: { token: string; studentId: number }) {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getAkademiEvaluationPeriods(token);
      setPeriods(result.data);
      setPeriodId(defaultPeriodId(result.data));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat periode evaluasi.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(() => {
      void load();
    });
  }, [load, token]);

  return (
    <section aria-labelledby="student-report-heading" className="border border-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="label-caps text-secondary">Rapor</p>
          <h2 id="student-report-heading" className="font-heading text-base font-black uppercase text-primary">
            Cetak Rapor Periode
          </h2>
        </div>

        {isLoading ? <p className="text-sm text-muted">Memuat periode...</p> : null}

        {error ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-secondary">{error}</p>
            <button className="min-h-11 border border-secondary/30 px-3 text-sm font-bold text-secondary" onClick={() => void load()} type="button">
              Coba lagi
            </button>
          </div>
        ) : null}

        {!isLoading && !error && periods.length === 0 ? (
          <p className="text-sm text-muted">Belum ada periode evaluasi. Buat periode di Pengaturan Evaluasi.</p>
        ) : null}

        {!isLoading && !error && periods.length > 0 ? (
          <div className="grid gap-2 sm:flex sm:items-center">
            <label className="sr-only" htmlFor="student-report-period">
              Periode rapor
            </label>
            <select
              id="student-report-period"
              className="min-h-11 w-full border border-border bg-white px-3 text-sm font-semibold text-primary sm:w-64"
              value={periodId}
              onChange={(event) => setPeriodId(event.target.value)}
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} ({statusLabels[period.status]})
                </option>
              ))}
            </select>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-4 text-sm font-bold text-white hover:bg-secondary-dark"
              href={`/academy/students/${studentId}/report?period_id=${periodId}`}
            >
              <Icon className="text-[18px]" name="print" />
              Cetak Rapor
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
