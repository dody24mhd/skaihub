import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "../../../_lib/admin-api";
import { resetSubscriptionStatus } from "../../ui/subscription-status";
import TodayClasses from "../today-classes";
import { makeSlot } from "./slot-fixture";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("../../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return {
    ...actual,
    getAkademiTodaySessions: vi.fn(),
    openAkademiSessionFromSchedule: vi.fn(),
    cancelAkademiTrainingSession: vi.fn(),
    rescheduleAkademiTrainingSession: vi.fn(),
    getAkademiSubscriptionStatus: vi.fn(),
  };
});

const slots: adminApi.TodaySlot[] = [
  makeSlot(),
  makeSlot({
    key: "session-9",
    training_schedule_id: null,
    session_id: 9,
    class_name: "Prestasi Malam",
    starts_at: "19:00",
    status: "cancelled",
    session_type: "extra",
    cancel_reason: "Dojang dipakai",
  }),
];

function setRole(role: string) {
  localStorage.setItem("skaihub_admin_token", "fake-token");
  localStorage.setItem("skaihub_admin_role", role);
}

describe("TodayClasses", () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    vi.mocked(adminApi.getAkademiTodaySessions).mockReset();
    vi.mocked(adminApi.getAkademiTodaySessions).mockResolvedValue({ date: "2026-10-19", coach_backfill_days: 7, data: slots });
    vi.mocked(adminApi.openAkademiSessionFromSchedule).mockResolvedValue({
      training_session: { id: 55 } as adminApi.TrainingSession,
    });
    resetSubscriptionStatus();
    vi.mocked(adminApi.getAkademiSubscriptionStatus).mockReset();
    vi.mocked(adminApi.getAkademiSubscriptionStatus).mockResolvedValue({
      subscription_state: "active",
    } as Awaited<ReturnType<typeof adminApi.getAkademiSubscriptionStatus>>);
    vi.mocked(adminApi.cancelAkademiTrainingSession).mockResolvedValue({
      training_session: { id: 55 } as adminApi.TrainingSession,
    });
  });

  it("menampilkan kartu slot dengan status dan menu untuk ketua", async () => {
    setRole("ketua_akademi");
    render(<TodayClasses />);

    expect(await screen.findByText("Reguler Sore")).toBeInTheDocument();
    expect(screen.getByText("Belum dibuka")).toBeInTheDocument();
    expect(screen.getByText("Batal")).toBeInTheDocument();
    expect(screen.getByText(/Dojang dipakai/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sesi Dibatalkan" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /sesi tambahan/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /aksi sesi/i })).toHaveLength(1);
  });

  it("membuka sesi dari jadwal lalu menuju form absensi", async () => {
    setRole("pelatih");
    render(<TodayClasses />);

    fireEvent.click(await screen.findByRole("button", { name: "Buka Absensi" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/academy/attendance/new?session=55"));
    expect(adminApi.openAkademiSessionFromSchedule).toHaveBeenCalledWith("fake-token", 7, "2026-10-19");
  });

  it("mode baca-saja menyembunyikan aksi tulis dan tidak membuka slot baru", async () => {
    vi.mocked(adminApi.getAkademiSubscriptionStatus).mockResolvedValue({
      subscription_state: "read_only",
    } as Awaited<ReturnType<typeof adminApi.getAkademiSubscriptionStatus>>);
    setRole("ketua_akademi");
    render(<TodayClasses />);

    await screen.findByText("Reguler Sore");
    await waitFor(() => expect(screen.getByRole("button", { name: "Buka Absensi" })).toBeDisabled());
    expect(screen.queryByRole("button", { name: /aksi sesi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sesi tambahan/i })).not.toBeInTheDocument();
  });

  it("pelatih tidak melihat menu aksi, sesi tambahan, atau tanggal mendatang", async () => {
    setRole("pelatih");
    render(<TodayClasses />);

    await screen.findByText("Reguler Sore");
    expect(screen.queryByRole("button", { name: /aksi sesi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sesi tambahan/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hari berikutnya" })).toBeDisabled();
    expect(screen.getByText(/hingga 7 hari ke belakang/i)).toBeInTheDocument();
  });

  it("membatalkan sesi lewat menu dengan alasan", async () => {
    setRole("admin_akademi");
    render(<TodayClasses />);

    fireEvent.click(await screen.findByRole("button", { name: /aksi sesi/i }));
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));
    fireEvent.change(screen.getByLabelText(/alasan/i), { target: { value: "Hujan deras" } });
    fireEvent.click(screen.getByRole("button", { name: "Batalkan Sesi" }));

    await waitFor(() => expect(adminApi.cancelAkademiTrainingSession).toHaveBeenCalledWith("fake-token", 55, "Hujan deras"));
    expect(await screen.findByText("Sesi dibatalkan.")).toBeInTheDocument();
    expect(adminApi.getAkademiTodaySessions).toHaveBeenCalledTimes(2);
  });

  it("menampilkan error dengan tombol coba lagi", async () => {
    setRole("ketua_akademi");
    vi.mocked(adminApi.getAkademiTodaySessions).mockRejectedValueOnce(new Error("Server sibuk"));
    render(<TodayClasses />);

    expect(await screen.findByText("Server sibuk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(await screen.findByText("Reguler Sore")).toBeInTheDocument();
  });
});
