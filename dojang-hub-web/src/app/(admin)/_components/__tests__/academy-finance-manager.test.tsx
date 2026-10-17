import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AcademyFinanceManager from "../academy-finance-manager";
import * as adminApi from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiSppBills: vi.fn(),
  getAkademiClasses: vi.fn(),
  downloadAkademiSppExport: vi.fn(),
}));

const mockBills = [
  {
    id: 1,
    akademi_id: 1,
    student_id: 1,
    billing_month: 10,
    billing_year: 2026,
    amount: "150000",
    paid_amount: "150000",
    status: "paid" as const,
    paid_at: "2026-10-05",
    payment_method: "cash",
    due_date: "2026-10-10",
    student: {
      id: 1,
      name: "Arya Pratama",
      member_number: "TKD-001",
    },
    class: {
      id: 1,
      name: "Reguler Sore",
    },
  },
];

describe("AcademyFinanceManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "test-token");
  });

  it("menampilkan pesan khusus jika user bukan Ketua Akademi", async () => {
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue({
      user: { id: 2, name: "Admin", email: "a@test.com", role: "admin_akademi" as const, is_active: true, akademi_id: 1, avatar_url: null },
      akademi: { id: 1, name: "Dojang", slug: "dojang", sport_type: "taekwondo", logo_url: null, status: "active" as const, plan: "pro" as const, plan_expires_at: null, created_at: "", updated_at: "" },
      subscription: null,
      entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
    });
    vi.mocked(adminApi.getAkademiSppBills).mockResolvedValue({
      data: { data: [], current_page: 1, last_page: 1, total: 0 },
    });
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue({ data: [] });

    render(<AcademyFinanceManager />);

    expect(
      await screen.findByText(/Akses keuangan hanya tersedia untuk Ketua Akademi/i)
    ).toBeInTheDocument();
  });

  it("merender rekap SPP dengan ResponsiveList untuk Ketua Akademi", async () => {
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue({
      user: { id: 1, name: "Ketua", email: "k@test.com", role: "ketua_akademi" as const, is_active: true, akademi_id: 1, avatar_url: null },
      akademi: { id: 1, name: "Dojang", slug: "dojang", sport_type: "taekwondo", logo_url: null, status: "active" as const, plan: "pro" as const, plan_expires_at: null, created_at: "", updated_at: "" },
      subscription: null,
      entitlements: { student_limit: 100, has_public_website: true, has_subdomain: true, has_rapor: true, has_exam_events: true, has_parent_portal: false },
    });
    vi.mocked(adminApi.getAkademiSppBills).mockResolvedValue({
      data: { data: mockBills as unknown as adminApi.SppBill[], current_page: 1, last_page: 1, total: 1 },
    });
    vi.mocked(adminApi.getAkademiClasses).mockResolvedValue({ data: [] });

    render(<AcademyFinanceManager />);

    expect(await screen.findByText("Rekap SPP")).toBeInTheDocument();
    expect(await screen.findAllByText("Arya Pratama")).toHaveLength(2); // desktop tabel & mobile card
  });
});
