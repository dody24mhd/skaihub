import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppGenerateModal from "../spp-generate-modal";

vi.mock("../../../_lib/admin-api", () => ({
  generateAkademiSppBills: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function trainingClass(id: number, override: string | null): api.TrainingClass {
  return {
    id,
    akademi_id: 1,
    training_place_id: null,
    name: `Kelas ${id}`,
    spp_amount_override: override,
    target_sessions_per_month: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

const classes = [trainingClass(1, "150000.00"), trainingClass(2, null)];

describe("SppGenerateModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("default bulan dan tahun saat ini serta keyboard angka untuk nominal", () => {
    const now = new Date();
    render(<SppGenerateModal token="token-uji" classes={classes} onClose={vi.fn()} onGenerated={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Bulan")).toHaveValue(String(now.getMonth() + 1));
    expect(within(dialog).getByLabelText(/Tahun/)).toHaveValue(now.getFullYear());
    expect(within(dialog).getByLabelText(/Nominal default/)).toHaveAttribute("inputmode", "numeric");
  });

  it("mewajibkan nominal default bila ada kelas tanpa nominal SPP", () => {
    render(<SppGenerateModal token="token-uji" classes={classes} onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));

    expect(screen.getByText(/Nominal default wajib diisi/)).toBeInTheDocument();
    expect(mockedApi.generateAkademiSppBills).not.toHaveBeenCalled();
  });

  it("memakai pengaturan akademi: nominal opsional dan petunjuk tanggal jatuh tempo", async () => {
    mockedApi.generateAkademiSppBills.mockResolvedValue({ message: "", created: 2, skipped: 0, missing_amount: 0 });
    render(
      <SppGenerateModal
        token="token-uji"
        classes={classes}
        settings={{ default_monthly_amount: "120000.00", due_day: 15 }}
        onClose={vi.fn()}
        onGenerated={vi.fn()}
      />,
    );

    expect(screen.getByText(/Rp 120.000/)).toBeInTheDocument();
    expect(screen.getByText(/tanggal 15/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));

    await waitFor(() =>
      expect(mockedApi.generateAkademiSppBills).toHaveBeenCalledWith("token-uji", expect.objectContaining({ default_amount: null, due_date: null })),
    );
  });

  it("nominal default opsional bila kelas terpilih sudah punya nominal SPP", async () => {
    mockedApi.generateAkademiSppBills.mockResolvedValue({ message: "", created: 3, skipped: 0, missing_amount: 0 });
    render(<SppGenerateModal token="token-uji" classes={classes} onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Kelas/), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));

    await waitFor(() =>
      expect(mockedApi.generateAkademiSppBills).toHaveBeenCalledWith("token-uji", expect.objectContaining({ class_id: 1, default_amount: null })),
    );
  });

  it("mengirim payload lalu menampilkan ringkasan hasil", async () => {
    mockedApi.generateAkademiSppBills.mockResolvedValue({ message: "", created: 5, skipped: 4, missing_amount: 1 });
    const onGenerated = vi.fn();
    render(<SppGenerateModal token="token-uji" classes={classes} onClose={vi.fn()} onGenerated={onGenerated} />);

    fireEvent.change(screen.getByLabelText(/Nominal default/), { target: { value: "125000" } });
    fireEvent.change(screen.getByLabelText(/Jatuh tempo/), { target: { value: "2026-10-10" } });
    fireEvent.click(screen.getByRole("button", { name: /buat tagihan/i }));

    await waitFor(() =>
      expect(mockedApi.generateAkademiSppBills).toHaveBeenCalledWith(
        "token-uji",
        expect.objectContaining({ default_amount: 125000, due_date: "2026-10-10", class_id: null }),
      ),
    );
    expect(onGenerated).toHaveBeenCalled();

    const result = await screen.findByTestId("spp-generate-result");
    expect(within(result).getByText("Dibuat").nextSibling).toHaveTextContent("5");
    expect(within(result).getByText(/sudah ada/).nextSibling).toHaveTextContent("3");
    expect(within(result).getByText(/nominal kosong/).nextSibling).toHaveTextContent("1");
  });
});
