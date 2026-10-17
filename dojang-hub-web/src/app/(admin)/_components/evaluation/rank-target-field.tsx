"use client";

import { SportRank, Student } from "../../_lib/admin-api";
import { higherRanks, skippedSteps } from "./rank-progression";

type RankTargetFieldProps = {
  id: string;
  label: string;
  ranks: SportRank[];
  student: Student | undefined;
  toRankId: string;
  setToRankId: (value: string) => void;
};

export function skipWarning(ranks: SportRank[], student: Student | undefined, target: SportRank | undefined): string {
  const current = student?.current_rank;
  const steps = skippedSteps(ranks, current, target);
  if (!current || !target || steps === 0) return "";

  return `Melewati ${steps} tingkat dari ${current.label} ke ${target.label}. Tetap bisa disimpan sesuai kebijakan akademi.`;
}

export default function RankTargetField({ id, label, ranks, student, toRankId, setToRankId }: RankTargetFieldProps) {
  const options = higherRanks(ranks, student?.current_rank);
  const target = ranks.find((rank) => String(rank.id) === toRankId);
  const warning = skipWarning(ranks, student, target);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-primary">
        {label} <span className="text-secondary">*</span>
      </label>
      <select
        id={id}
        className="min-h-11 w-full rounded-md border border-border-strong bg-white px-3 text-base text-primary focus:border-primary sm:text-sm"
        value={toRankId}
        onChange={(e) => setToRankId(e.target.value)}
        aria-describedby={warning ? `${id}-warning` : undefined}
        required
      >
        <option value="">Pilih tingkatan</option>
        {options.map((rank) => (
          <option key={rank.id} value={rank.id}>
            {rank.label}
          </option>
        ))}
      </select>
      {warning ? (
        <p
          id={`${id}-warning`}
          role="status"
          className="rounded-md border border-belt-yellow bg-belt-yellow/10 p-2 text-xs font-semibold text-primary"
        >
          {warning}
        </p>
      ) : null}
    </div>
  );
}
