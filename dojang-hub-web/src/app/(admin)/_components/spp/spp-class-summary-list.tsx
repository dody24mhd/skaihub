import { SppBill, TrainingClass } from "../../_lib/admin-api";
import { money } from "../students/format";
import { billsForClass, summarizeBills } from "./spp-summary";

function Stat({ label, value, tone = "text-primary", extra }: { label: string; value: string | number; tone?: string; extra?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className={`font-bold ${tone}`}>{value}</p>
      {extra ? <p className="text-xs text-muted">{extra}</p> : null}
    </div>
  );
}

export default function SppClassSummaryList({
  classes,
  bills,
  onSelect,
}: {
  classes: TrainingClass[];
  bills: SppBill[];
  onSelect: (classId: number) => void;
}) {
  if (!classes.length) return <p className="py-8 text-sm text-muted">Belum ada kelas.</p>;

  return (
    <div className="mt-5 divide-y divide-border">
      {classes.map((classItem) => {
        const classBills = billsForClass(bills, classItem.id);
        const totals = summarizeBills(classBills);

        return (
          <div key={classItem.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="break-words font-bold text-primary">{classItem.name}</p>
              <p className="mt-1 text-xs text-muted">
                SPP kelas saat ini {classItem.spp_amount_override ? money(classItem.spp_amount_override) : "belum diatur"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[560px]">
              <Stat label="Tertagih" value={`${classBills.length} siswa`} />
              <Stat label="Lunas" value={totals.paidCount} tone="text-success-strong" />
              <Stat label="Sebagian" value={totals.partialCount} />
              <Stat label="Tindak lanjut" value={totals.unpaidCount} tone="text-secondary" extra={totals.waivedCount ? `${totals.waivedCount} bebas` : undefined} />
            </div>
            <button
              className="min-h-11 w-full border border-border bg-white px-4 text-sm font-bold text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted lg:w-auto"
              disabled={!classBills.length}
              onClick={() => onSelect(classItem.id)}
              type="button"
            >
              Lihat Tagihan
            </button>
          </div>
        );
      })}
    </div>
  );
}
