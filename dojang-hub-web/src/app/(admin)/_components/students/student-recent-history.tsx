import { StudentDetailResponse, StudentEvaluationScore } from "../../_lib/admin-api";
import DetailSectionCard from "./detail-section-card";
import { money, monthLabel, shortDate } from "./format";

const LATEST_LIMIT = 5;

// Record<string, ...> agar status baru dari backend (mis. `sick`) tetap punya label.
const attendanceLabels: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak hadir",
  excused: "Izin",
  sick: "Sakit",
};

const indicatorLabels: Record<StudentEvaluationScore["indicator"], string> = {
  kurang: "Kurang",
  cukup: "Cukup",
  baik: "Baik",
  sangat_baik: "Sangat baik",
};

const sppStatusLabels: Record<string, string> = {
  unpaid: "Belum lunas",
  partial: "Sebagian",
  paid: "Lunas",
  waived: "Dibebaskan",
};

type HistoryRow = {
  id: number;
  title: string;
  badge: string;
  isPositive: boolean;
  caption: string;
};

function HistoryCard({ title, rows, total, emptyText, unit }: { title: string; rows: HistoryRow[]; total: number; emptyText: string; unit: string }) {
  return (
    <DetailSectionCard title={title}>
      <div className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words font-bold text-primary">{row.title}</p>
              <span className={`shrink-0 px-2 py-1 text-xs font-bold ${row.isPositive ? "bg-success/10 text-success-strong" : "bg-secondary/10 text-secondary"}`}>
                {row.badge}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{row.caption}</p>
          </div>
        ))}
        {!total ? <p className="py-4 text-sm text-muted">{emptyText}</p> : null}
        {total > LATEST_LIMIT ? <p className="pt-3 text-xs font-semibold text-muted">Menampilkan {LATEST_LIMIT} {unit} terbaru dari {total} histori.</p> : null}
      </div>
    </DetailSectionCard>
  );
}

export default function StudentRecentHistory({ data }: { data: StudentDetailResponse }) {
  const { student, attendances, spp_bills: sppBills, evaluation_scores: scores, rank_promotions: promotions } = data;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <HistoryCard
        title="Absensi Terbaru"
        total={attendances.length}
        unit="data"
        emptyText="Belum ada histori absensi."
        rows={attendances.slice(0, LATEST_LIMIT).map((item) => ({
          id: item.id,
          title: item.session?.class?.name || student.primary_class?.name || "-",
          badge: attendanceLabels[item.status] || item.status,
          isPositive: item.status === "present",
          caption: `${shortDate(item.session?.session_date)} - ${item.session?.material || "Tanpa materi"}`,
        }))}
      />
      <HistoryCard
        title="SPP Terbaru"
        total={sppBills.length}
        unit="tagihan"
        emptyText="Belum ada tagihan SPP."
        rows={sppBills.slice(0, LATEST_LIMIT).map((item) => ({
          id: item.id,
          title: monthLabel(item.billing_year, item.billing_month),
          badge: sppStatusLabels[item.status],
          isPositive: item.status === "paid",
          caption: `${money(item.paid_amount)} / ${money(item.amount)}`,
        }))}
      />
      <HistoryCard
        title="Penilaian Terbaru"
        total={scores.length}
        unit="nilai"
        emptyText="Belum ada nilai penilaian."
        rows={scores.slice(0, LATEST_LIMIT).map((item) => ({
          id: item.id,
          title: item.aspect?.name || "-",
          badge: indicatorLabels[item.indicator],
          isPositive: true,
          caption: `${item.period?.name || "-"} - Nilai ${item.score}`,
        }))}
      />
      <HistoryCard
        title="Kenaikan Tingkat"
        total={promotions.length}
        unit="histori"
        emptyText="Belum ada histori kenaikan tingkat."
        rows={promotions.slice(0, LATEST_LIMIT).map((item) => ({
          id: item.id,
          title: item.event?.name || "-",
          badge: item.result === "passed" ? "Lulus" : item.result,
          isPositive: item.result === "passed",
          caption: `${item.from_rank?.label || "-"} ke ${item.to_rank?.label || "-"}`,
        }))}
      />
    </section>
  );
}
