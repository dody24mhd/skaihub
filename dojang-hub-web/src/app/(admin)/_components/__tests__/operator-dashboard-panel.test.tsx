import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperatorDashboard } from "../../_lib/admin-api";
import OperatorDashboardPanel from "../operator-dashboard-panel";

const getOperatorDashboard = vi.fn();

vi.mock("../../_lib/admin-api", () => ({
  getOperatorDashboard: (token: string) => getOperatorDashboard(token),
}));

const DASHBOARD: OperatorDashboard = {
  mrr: 397000,
  state_counts: { active: 2, expiring: 1, grace: 1, read_only: 1 },
  attention: [
    {
      akademi_id: 4,
      akademi_name: "Akademi Baca Saja",
      akademi_slug: "baca-saja",
      plan: "starter",
      state: "read_only",
      days_left: 0,
      ends_at: "2026-08-31T23:59:59+07:00",
      active_students: 10,
      student_limit: 0,
    },
    {
      akademi_id: 2,
      akademi_name: "Akademi Segera",
      akademi_slug: "segera",
      plan: "pro",
      state: "expiring",
      days_left: 9,
      ends_at: "2026-10-10T23:59:59+07:00",
      active_students: 20,
      student_limit: 200,
    },
  ],
  near_quota: [
    {
      akademi_id: 5,
      akademi_name: "Akademi Penuh",
      akademi_slug: "penuh",
      plan: "starter",
      active_students: 85,
      student_limit: 100,
      usage_percent: 85,
    },
  ],
};

describe("OperatorDashboardPanel", () => {
  beforeEach(() => {
    getOperatorDashboard.mockReset();
  });

  it("shows MRR, state counts, follow-up list and near-quota akademi", async () => {
    getOperatorDashboard.mockResolvedValue(DASHBOARD);

    render(<OperatorDashboardPanel token="token-1" />);

    expect(await screen.findByText("Rp 397.000")).toBeInTheDocument();
    expect(screen.getByTestId("state-count-read_only")).toHaveTextContent("1");
    expect(screen.getByTestId("state-count-active")).toHaveTextContent("2");
    expect(screen.getByText("Akademi Baca Saja")).toBeInTheDocument();
    expect(screen.getByText(/Paket Pro · 9 hari lagi/)).toBeInTheDocument();
    expect(screen.getByText("Akademi Penuh")).toBeInTheDocument();
    expect(screen.getByText("85 / 100 siswa (85%)")).toBeInTheDocument();
    expect(getOperatorDashboard).toHaveBeenCalledWith("token-1");
  });

  it("shows empty states when nothing needs follow-up", async () => {
    getOperatorDashboard.mockResolvedValue({
      ...DASHBOARD,
      attention: [],
      near_quota: [],
    });

    render(<OperatorDashboardPanel token="token-1" />);

    expect(await screen.findByText("Semua langganan akademi aman.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada akademi yang mendekati kuota.")).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    getOperatorDashboard.mockRejectedValueOnce(new Error("Request admin gagal.")).mockResolvedValueOnce(DASHBOARD);

    render(<OperatorDashboardPanel token="token-1" />);

    expect(await screen.findByText(/Gagal memuat ringkasan operator/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByText("Rp 397.000")).toBeInTheDocument();
  });
});
