import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppWaiveModal from "../spp-waive-modal";

vi.mock("../../../_lib/admin-api", () => ({
  waiveAkademiSppBill: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function bill(overrides: Partial<api.SppBill>): api.SppBill {
  return {
    id: 9,
    akademi_id: 1,
    student_id: 1,
    class_id: 1,
    billing_year: 2026,
    billing_month: 10,
    amount: "150000.00",
    paid_amount: "0.00",
    due_date: null,
    status: "unpaid",
    notes: null,
    student: { name: "Arya Pratama" } as api.SppBill["student"],
    ...overrides,
  };
}

describe("SppWaiveModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tagihan belum dibayar boleh dibebaskan tanpa alasan", async () => {
    mockedApi.waiveAkademiSppBill.mockResolvedValue({ spp_bill: bill({ status: "waived" }) });
    const onWaived = vi.fn();
    render(<SppWaiveModal token="t" bill={bill({})} onClose={vi.fn()} onWaived={onWaived} />);

    fireEvent.click(screen.getByRole("button", { name: /bebaskan tagihan/i }));

    await waitFor(() => expect(mockedApi.waiveAkademiSppBill).toHaveBeenCalledWith("t", 9, null, null));
    expect(onWaived).toHaveBeenCalled();
  });

  it("tagihan yang sudah dibayar sebagian wajib alasan", async () => {
    mockedApi.waiveAkademiSppBill.mockResolvedValue({ spp_bill: bill({ status: "waived" }) });
    render(<SppWaiveModal token="t" bill={bill({ status: "partial", paid_amount: "50000.00" })} onClose={vi.fn()} onWaived={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /bebaskan tagihan/i }));
    expect(screen.getByText(/Alasan wajib diisi/)).toBeInTheDocument();
    expect(mockedApi.waiveAkademiSppBill).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Alasan/), { target: { value: "Keringanan keluarga" } });
    fireEvent.click(screen.getByRole("button", { name: /bebaskan tagihan/i }));

    await waitFor(() => expect(mockedApi.waiveAkademiSppBill).toHaveBeenCalledWith("t", 9, null, "Keringanan keluarga"));
  });

  it("menampilkan error server di dalam modal", async () => {
    mockedApi.waiveAkademiSppBill.mockRejectedValue(new Error("Tagihan sudah lunas."));
    render(<SppWaiveModal token="t" bill={bill({})} onClose={vi.fn()} onWaived={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /bebaskan tagihan/i }));

    expect(await screen.findByText("Tagihan sudah lunas.")).toBeInTheDocument();
  });
});
