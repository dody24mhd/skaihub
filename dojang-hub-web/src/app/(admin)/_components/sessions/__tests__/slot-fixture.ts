import { TodaySlot } from "../../../_lib/admin-api";

export function makeSlot(overrides: Partial<TodaySlot> = {}): TodaySlot {
  return {
    key: "schedule-7-2026-10-19",
    date: "2026-10-19",
    training_schedule_id: 7,
    session_id: null,
    class_id: 1,
    class_name: "Reguler Sore",
    place_name: "Dojang Utama",
    starts_at: "16:00",
    ends_at: "17:30",
    coach_ids: [4],
    coach_names: ["Sabeum Budi"],
    status: "not_opened",
    session_type: "regular",
    attendances_count: 0,
    present_count: 0,
    reschedule_reason: null,
    cancel_reason: null,
    rescheduled_to: null,
    rescheduled_from: null,
    ...overrides,
  };
}
