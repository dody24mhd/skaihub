import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppPaymentModal from "../spp-payment-modal";

vi.mock("../../../_lib/admin-api", () => ({
  payAkademiSppBill: vi.fn(),
  uploadAkademiFile: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const bill: api.SppBill = {
  id: 9,
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
  student: { name: "Arya Pratama" } as api.SppBill["student"],
};

describe("SppPaymentModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("membuka SheetModal dengan nominal default sisa tagihan dan keyboard angka", () => {
    render(<SppPaymentModal token="token-uji" bill={bill} onClose={vi.fn()} onPaid={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Arya Pratama")).toBeInTheDocument();
    const amount = within(dialog).getByLabelText(/Nominal bayar/);
    expect(amount).toHaveValue(100000);
    expect(amount).toHaveAttribute("inputmode", "numeric");
  });

  it("mengirim pembayaran lalu memanggil onPaid", async () => {
    mockedApi.payAkademiSppBill.mockResolvedValue({ spp_bill: { ...bill, status: "paid" } });
    const onPaid = vi.fn();
    render(<SppPaymentModal token="token-uji" bill={bill} onClose={vi.fn()} onPaid={onPaid} />);

    fireEvent.change(screen.getByLabelText(/Metode/), { target: { value: "transfer" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan pembayaran/i }));

    await waitFor(() =>
      expect(mockedApi.payAkademiSppBill).toHaveBeenCalledWith("token-uji", 9, expect.objectContaining({ amount: 100000, method: "transfer", proof_url: null, notes: null })),
    );
    expect(onPaid).toHaveBeenCalled();
  });

  it("menampilkan error di dalam modal bila gagal", async () => {
    mockedApi.payAkademiSppBill.mockRejectedValue(new Error("Nominal melebihi sisa tagihan."));
    const onPaid = vi.fn();
    render(<SppPaymentModal token="token-uji" bill={bill} onClose={vi.fn()} onPaid={onPaid} />);

    fireEvent.click(screen.getByRole("button", { name: /simpan pembayaran/i }));

    expect(await within(screen.getByRole("dialog")).findByText("Nominal melebihi sisa tagihan.")).toBeInTheDocument();
    expect(onPaid).not.toHaveBeenCalled();
  });
});
