import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "../../../_lib/admin-api";
import { addDays, canManageSlot, canOpenSlot, dateBounds, dateLabel, resolveSlotSessionId } from "../today-utils";
import { makeSlot } from "./slot-fixture";

vi.mock("../../../_lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof adminApi>();
  return { ...actual, openAkademiSessionFromSchedule: vi.fn() };
});

describe("today-utils", () => {
  beforeEach(() => {
    vi.mocked(adminApi.openAkademiSessionFromSchedule).mockReset();
  });

  it("menghitung tanggal lintas bulan dan label relatif", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(dateLabel("2026-10-19", "2026-10-19")).toBe("Hari ini");
    expect(dateLabel("2026-10-18", "2026-10-19")).toBe("Kemarin");
    expect(dateLabel("2026-10-14", "2026-10-19")).toBe("Rabu, 14 Okt");
  });

  it("membatasi pelatih hingga N hari ke belakang dan tidak ke depan", () => {
    expect(dateBounds("2026-10-19", 7, false)).toEqual({ min: "2026-10-12", max: "2026-10-19" });
    expect(dateBounds("2026-10-19", 7, true)).toEqual({});
  });

  it("menentukan slot yang bisa dibuka dan dikelola", () => {
    expect(canOpenSlot(makeSlot({ status: "cancelled", session_id: 3 }))).toBe(false);
    expect(canOpenSlot(makeSlot({ status: "rescheduled", session_id: 3, rescheduled_to: null }))).toBe(false);
    expect(canOpenSlot(makeSlot())).toBe(true);
    expect(canManageSlot(makeSlot({ status: "completed", session_id: 3 }))).toBe(false);
    expect(canManageSlot(makeSlot({ status: "draft", session_id: 3 }))).toBe(true);
  });

  it("membuka sesi dari jadwal hanya bila belum ada sesi", async () => {
    vi.mocked(adminApi.openAkademiSessionFromSchedule).mockResolvedValue({
      training_session: { id: 55 } as adminApi.TrainingSession,
    });

    await expect(resolveSlotSessionId("token", makeSlot())).resolves.toBe(55);
    expect(adminApi.openAkademiSessionFromSchedule).toHaveBeenCalledWith("token", 7, "2026-10-19");

    await expect(resolveSlotSessionId("token", makeSlot({ status: "draft", session_id: 9 }))).resolves.toBe(9);
    await expect(
      resolveSlotSessionId(
        "token",
        makeSlot({ status: "rescheduled", session_id: 9, rescheduled_to: { id: 12, session_date: "2026-10-21", starts_at: "15:00" } }),
      ),
    ).resolves.toBe(12);
    expect(adminApi.openAkademiSessionFromSchedule).toHaveBeenCalledTimes(1);
  });
});
