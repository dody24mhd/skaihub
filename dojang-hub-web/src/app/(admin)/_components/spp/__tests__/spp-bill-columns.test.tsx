import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SppBill } from "../../../_lib/admin-api";
import { ResponsiveList } from "../../ui";
import { buildSppBillColumns } from "../spp-bill-columns";

function bill(overrides: Partial<SppBill>): SppBill {
  return {
    id: 1,
    akademi_id: 1,
    student_id: 1,
    class_id: 1,
    billing_year: 2026,
    billing_month: 10,
    amount: "150000.00",
    paid_amount: "50000.00",
    due_date: null,
    status: "partial",
    notes: null,
    student: { name: "Arya Pratama" } as SppBill["student"],
    ...overrides,
  };
}

function renderBills(canManage: boolean) {
  const onPay = vi.fn();
  const onWaive = vi.fn();
  const rows = [bill({}), bill({ id: 2, status: "paid", paid_amount: "150000.00", student: { name: "Dewi" } as SppBill["student"] })];
  render(
    <ResponsiveList columns={buildSppBillColumns({ canManage, onPay, onWaive })} rows={rows} getRowKey={(row) => row.id} />,
  );
  return { rows, onPay, onWaive };
}

function normalize(text: string | null) {
  return (text || "").replace(/\s/g, " ");
}

describe("buildSppBillColumns", () => {
  it("kartu HP berisi nama, periode, nominal, status, dan sisa", () => {
    renderBills(false);

    const card = screen.getAllByTestId("responsive-list-card")[0];
    const text = normalize(card.textContent);
    expect(text).toContain("Arya Pratama");
    expect(text).toContain("Okt 2026");
    expect(text).toContain("Rp 150.000");
    expect(text).toContain("Rp 100.000");
    expect(text).toContain("Sebagian");
  });

  it("aksi bayar dan bebaskan hanya untuk tagihan terbuka bila berhak mengelola", () => {
    const { rows, onPay, onWaive } = renderBills(true);
    const [openCard, paidCard] = screen.getAllByTestId("responsive-list-card");

    fireEvent.click(within(openCard).getByRole("button", { name: /bayar/i }));
    fireEvent.click(within(openCard).getByRole("button", { name: /bebaskan/i }));
    expect(onPay).toHaveBeenCalledWith(rows[0]);
    expect(onWaive).toHaveBeenCalledWith(rows[0]);
    expect(within(paidCard).queryByRole("button", { name: /bayar/i })).not.toBeInTheDocument();
  });

  it("menampilkan badge Terlambat hanya untuk tagihan yang lewat jatuh tempo", () => {
    const rows = [bill({ is_overdue: true }), bill({ id: 2, is_overdue: false, student: { name: "Dewi" } as SppBill["student"] })];
    render(
      <ResponsiveList columns={buildSppBillColumns({ canManage: false, onPay: vi.fn(), onWaive: vi.fn() })} rows={rows} getRowKey={(row) => row.id} />,
    );

    const [lateCard, onTimeCard] = screen.getAllByTestId("responsive-list-card");
    expect(within(lateCard).getByText("Terlambat")).toBeInTheDocument();
    expect(within(onTimeCard).queryByText("Terlambat")).not.toBeInTheDocument();
  });

  it("tanpa hak kelola tidak ada kolom aksi", () => {
    renderBills(false);

    expect(screen.queryByRole("button", { name: /bayar/i })).not.toBeInTheDocument();
  });
});
