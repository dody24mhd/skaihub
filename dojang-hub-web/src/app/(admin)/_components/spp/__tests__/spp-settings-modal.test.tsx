import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import SppSettingsModal from "../spp-settings-modal";

vi.mock("../../../_lib/admin-api", () => ({
  updateAkademiSppSettings: vi.fn(),
}));

const mockedApi = vi.mocked(api);

describe("SppSettingsModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengisi form dari pengaturan yang ada", () => {
    render(
      <SppSettingsModal token="t" settings={{ default_monthly_amount: "150000.00", due_day: 10 }} onClose={vi.fn()} onSaved={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/Nominal SPP default/)).toHaveValue(150000);
    expect(within(dialog).getByLabelText(/Tanggal jatuh tempo/)).toHaveValue(10);
  });

  it("menyimpan nominal kosong sebagai null lalu memanggil onSaved", async () => {
    const saved = { default_monthly_amount: null, due_day: 5 };
    mockedApi.updateAkademiSppSettings.mockResolvedValue({ spp_settings: saved });
    const onSaved = vi.fn();
    render(
      <SppSettingsModal token="t" settings={{ default_monthly_amount: "150000.00", due_day: 10 }} onClose={vi.fn()} onSaved={onSaved} />,
    );

    fireEvent.change(screen.getByLabelText(/Nominal SPP default/), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Tanggal jatuh tempo/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan pengaturan/i }));

    await waitFor(() =>
      expect(mockedApi.updateAkademiSppSettings).toHaveBeenCalledWith("t", { default_monthly_amount: null, due_day: 5 }),
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("menolak tanggal jatuh tempo di luar 1-28 tanpa memanggil API", () => {
    render(<SppSettingsModal token="t" settings={{ default_monthly_amount: null, due_day: 10 }} onClose={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Tanggal jatuh tempo/), { target: { value: "31" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan pengaturan/i }));

    expect(screen.getByText(/antara 1 dan 28/)).toBeInTheDocument();
    expect(mockedApi.updateAkademiSppSettings).not.toHaveBeenCalled();
  });

  it("menampilkan error server di dalam modal", async () => {
    mockedApi.updateAkademiSppSettings.mockRejectedValue(new Error("Gagal menyimpan."));
    render(<SppSettingsModal token="t" settings={{ default_monthly_amount: null, due_day: 10 }} onClose={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /simpan pengaturan/i }));

    expect(await within(screen.getByRole("dialog")).findByText("Gagal menyimpan.")).toBeInTheDocument();
  });
});
