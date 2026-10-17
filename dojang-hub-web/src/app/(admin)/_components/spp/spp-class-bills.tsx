import { SppBill, TrainingClass } from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";

type SppClassBillsProps = {
  classItem: TrainingClass;
  bills: SppBill[];
  columns: ResponsiveColumn<SppBill>[];
  periodLabel: string;
  onBack: () => void;
};

export default function SppClassBills({ classItem, bills, columns, periodLabel, onBack }: SppClassBillsProps) {
  return (
    <>
      <div className="mt-5 flex flex-col gap-3 border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-primary">{classItem.name}</p>
          <p className="mt-1 text-xs text-muted">
            {bills.length} tagihan pada {periodLabel}
          </p>
        </div>
        <button className="min-h-11 border border-border bg-white px-4 text-sm font-bold text-primary" onClick={onBack} type="button">
          Kembali ke Daftar Kelas
        </button>
      </div>
      <ResponsiveList
        className="mt-5"
        columns={columns}
        rows={bills}
        getRowKey={(item) => item.id}
        ariaLabel={`Tagihan SPP ${classItem.name}`}
        emptyState={<p className="mt-5 border-2 border-dashed border-border p-8 text-center text-sm text-muted">Belum ada tagihan SPP untuk kelas ini.</p>}
      />
    </>
  );
}
