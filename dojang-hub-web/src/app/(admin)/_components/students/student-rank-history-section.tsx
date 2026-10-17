"use client";

import { StudentRankHistory, getAkademiStudentRankHistories } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import DetailSectionCard from "./detail-section-card";
import { shortDate } from "./format";
import { useStudentList } from "./use-student-list";

function sourceLabel(item: StudentRankHistory) {
  if (item.source_type === "promotion_event") {
    return `Kenaikan tingkat: ${item.promotion_participant?.event?.name || "UKT"}`;
  }

  return item.changed_by ? `Perubahan manual oleh ${item.changed_by.name}` : "Perubahan manual";
}

export default function StudentRankHistorySection({ token, studentId }: { token: string; studentId: number }) {
  const { items, isLoading, error, reload } = useStudentList(
    token,
    studentId,
    getAkademiStudentRankHistories,
    "Gagal memuat riwayat sabuk.",
  );

  return (
    <DetailSectionCard title="Riwayat Sabuk" isLoading={isLoading} error={error} onRetry={reload}>
      {items.length ? (
        <ol className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <AcademyRankBeltBadge rank={item.sport_rank} size="sm" showLabel={false} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-bold text-primary">{item.sport_rank?.label || "-"}</p>
                  <span className="text-xs font-semibold text-muted">{shortDate(item.achieved_on)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{sourceLabel(item)}</p>
                {item.notes ? <p className="mt-1 break-words text-sm text-muted">{item.notes}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-4 text-sm text-muted">Belum ada riwayat sabuk.</p>
      )}
    </DetailSectionCard>
  );
}
