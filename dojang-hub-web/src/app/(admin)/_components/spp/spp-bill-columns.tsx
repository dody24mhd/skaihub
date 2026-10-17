import { SppBill } from "../../_lib/admin-api";
import { money } from "../students/format";
import { ResponsiveColumn } from "../ui";
import { SPP_MONTH_LABELS, isBillOpen, remainingAmount, sppStatusLabels } from "./spp-summary";

export function buildSppBillColumns({
  canManage,
  onPay,
  onWaive,
}: {
  canManage: boolean;
  onPay: (item: SppBill) => void;
  onWaive: (item: SppBill) => void;
}): ResponsiveColumn<SppBill>[] {
  const columns: ResponsiveColumn<SppBill>[] = [
    {
      key: "student",
      header: "Siswa",
      primary: true,
      render: (item) => <span className="break-words font-bold text-primary">{item.student?.name || "-"}</span>,
    },
    {
      key: "period",
      header: "Periode",
      render: (item) => <span className="text-muted">{SPP_MONTH_LABELS[item.billing_month - 1]} {item.billing_year}</span>,
    },
    {
      key: "amount",
      header: "Tagihan",
      render: (item) => <span className="text-muted">{money(item.amount)}</span>,
    },
    {
      key: "paid",
      header: "Terbayar",
      render: (item) => <span className="text-muted">{money(item.paid_amount)}</span>,
    },
    {
      key: "remaining",
      header: "Sisa",
      render: (item) => <span className="font-bold text-primary">{money(remainingAmount(item))}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span className="inline-flex flex-wrap gap-1">
          <span className={`inline-flex px-2 py-1 text-xs font-bold ${item.status === "paid" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
            {sppStatusLabels[item.status]}
          </span>
          {item.is_overdue ? (
            <span className="inline-flex bg-secondary px-2 py-1 text-xs font-bold text-white">Terlambat</span>
          ) : null}
        </span>
      ),
    },
  ];

  if (!canManage) return columns;

  return [
    ...columns,
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      headerClassName: "text-right",
      render: (item) =>
        isBillOpen(item) ? (
          <div className="flex justify-end gap-2">
            <button className="inline-flex min-h-11 items-center border border-border bg-white px-3 text-xs font-bold text-primary" onClick={() => onPay(item)} type="button">
              Bayar
            </button>
            <button className="inline-flex min-h-11 items-center border border-secondary/30 bg-white px-3 text-xs font-bold text-secondary" onClick={() => onWaive(item)} type="button">
              Bebaskan
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">-</span>
        ),
    },
  ];
}
