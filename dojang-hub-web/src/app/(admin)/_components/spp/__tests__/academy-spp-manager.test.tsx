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

  it("filter Terlambat meminta tagihan overdue tanpa filter status", async () => {
    render(<AcademySppManager />);

    fireEvent.change(await screen.findByLabelText("Status tagihan"), { target: { value: "overdue" } });

    await waitFor(() =>
      expect(mockedApi.getAkademiSppBills).toHaveBeenLastCalledWith("token-uji", expect.objectContaining({ status: "all", overdue: true })),
    );
  });

  it("tab Tunggakan menampilkan daftar tunggakan per siswa", async () => {
    mockedApi.getAkademiSppArrears.mockResolvedValue({
      data: [
        {
          student: { id: 3, name: "Bima Satria", member_number: "TKD-0003", primary_class_id: null, student_phone: null, guardian_name: null, guardian_phone: null },
          months_count: 2,
          total_remaining: "175000.00",
          oldest_due_date: "2026-08-10",
        },
      ],
    });
    render(<AcademySppManager />);

    fireEvent.click(await screen.findByRole("button", { name: "Tunggakan" }));

    expect((await screen.findAllByText("Bima Satria")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Tunggakan" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText("Status tagihan")).not.toBeInTheDocument();
  });

  it("setelah bayar menampilkan tautan ke kwitansi pembayaran terbaru", async () => {
    const bill: api.SppBill = {
      id: 9,
      akademi_id: 1,
      student_id: 1,
      class_id: 1,
      billing_year: 2026,
      billing_month: 10,
      amount: "150000.00",
      paid_amount: "0.00",
      due_date: "2026-10-10",
      status: "unpaid",
      notes: null,
      student: { name: "Arya Pratama", primary_class_id: 1 } as api.SppBill["student"],
    };
    mockedApi.getAkademiClasses.mockResolvedValue({
      data: [{ id: 1, akademi_id: 1, training_place_id: null, name: "Reguler", spp_amount_override: null, target_sessions_per_month: 4, is_active: true, created_at: "", updated_at: "" }],
    });
    mockedApi.getAkademiSppBills.mockResolvedValue({ data: { data: [bill], current_page: 1, last_page: 1, total: 1 } });
    const payment = { id: 44, spp_bill_id: 9, receipt_number: "KW-202610-0002", amount: "150000.00", paid_at: "2026-10-05", method: "cash", proof_url: null, notes: null, created_by: 1 };
    mockedApi.payAkademiSppBill.mockResolvedValue({ spp_bill: { ...bill, status: "paid", paid_amount: "150000.00", payments: [payment] } });
    render(<AcademySppManager />);

    fireEvent.click(await screen.findByRole("button", { name: "Lihat Tagihan" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Bayar" })[0]);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /simpan pembayaran/i }));

    const link = await screen.findByRole("link", { name: "Lihat kwitansi" });
    expect(link).toHaveAttribute("href", "/academy/spp/receipts/44");
  });

  it("pelatih tidak melihat tombol pengaturan dan tidak memuat pengaturan", async () => {
    mockedApi.getAkademiMe.mockResolvedValue(meResponse("pelatih"));
    render(<AcademySppManager />);

    expect(await screen.findByText("Rekap SPP")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pengaturan SPP" })).not.toBeInTheDocument();
    expect(mockedApi.getAkademiSppSettings).not.toHaveBeenCalled();
  });
});
