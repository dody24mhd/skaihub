import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import AcademySppManager from "../../academy-spp-manager";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiSppBills: vi.fn(),
  getAkademiClasses: vi.fn(),
  getAkademiSppSettings: vi.fn(),
  getAkademiSppArrears: vi.fn(),
  updateAkademiSppSettings: vi.fn(),
  waiveAkademiSppBill: vi.fn(),
  generateAkademiSppBills: vi.fn(),
  payAkademiSppBill: vi.fn(),
  uploadAkademiFile: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function meResponse(role: api.AdminUser["role"]) {
  return {
    user: { id: 1, name: "Ketua", email: "k@test.com", role, is_active: true, akademi_id: 1, avatar_url: null },
    akademi: { id: 1, name: "Dojang", slug: "dojang", sport_type: "taekwondo", logo_url: null, status: "active" as const, plan: "pro" as const, plan_expires_at: null, created_at: "", updated_at: "" },
    subscription: null,
    entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
  };
}

describe("AcademySppManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
    mockedApi.getAkademiMe.mockResolvedValue(meResponse("ketua_akademi"));
    mockedApi.getAkademiSppBills.mockResolvedValue({ data: { data: [], current_page: 1, last_page: 1, total: 0 } });
    mockedApi.getAkademiClasses.mockResolvedValue({ data: [] });
    mockedApi.getAkademiSppSettings.mockResolvedValue({ spp_settings: { default_monthly_amount: "120000.00", due_day: 10 } });
    mockedApi.getAkademiSppArrears.mockResolvedValue({ data: [] });
  });

  it("tombol pengaturan membuka SheetModal berisi pengaturan akademi lalu menyimpannya", async () => {
    mockedApi.updateAkademiSppSettings.mockResolvedValue({ spp_settings: { default_monthly_amount: "130000.00", due_day: 5 } });
    render(<AcademySppManager />);

    await waitFor(() => expect(mockedApi.getAkademiSppSettings).toHaveBeenCalled());
    fireEvent.click(await screen.findByRole("button", { name: "Pengaturan SPP" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Nominal SPP default/)).toHaveValue(120000);

    fireEvent.change(within(dialog).getByLabelText(/Nominal SPP default/), { target: { value: "130000" } });
    fireEvent.change(within(dialog).getByLabelText(/Tanggal jatuh tempo/), { target: { value: "5" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /simpan pengaturan/i }));

    expect(await screen.findByText("Pengaturan SPP tersimpan.")).toBeInTheDocument();
    expect(mockedApi.updateAkademiSppSettings).toHaveBeenCalledWith("token-uji", { default_monthly_amount: 130000, due_day: 5 });
  });

  it("pelatih tidak melihat tombol pengaturan dan tidak memuat pengaturan", async () => {
    mockedApi.getAkademiMe.mockResolvedValue(meResponse("pelatih"));
    render(<AcademySppManager />);

    expect(await screen.findByText("Rekap SPP")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pengaturan SPP" })).not.toBeInTheDocument();
    expect(mockedApi.getAkademiSppSettings).not.toHaveBeenCalled();
  });
});
