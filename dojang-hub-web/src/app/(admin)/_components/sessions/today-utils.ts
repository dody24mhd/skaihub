import {
  AdminUser,
  TodaySlot,
  TodaySlotStatus,
  openAkademiSessionFromSchedule,
} from "../../_lib/admin-api";

export const TOKEN_KEY = "skaihub_admin_token";
export const ROLE_KEY = "skaihub_admin_role";

const ADMIN_ROLES: ReadonlyArray<AdminUser["role"]> = ["ketua_akademi", "admin_akademi"];

export const SLOT_STATUS_LABELS: Record<TodaySlotStatus, string> = {
  not_opened: "Belum dibuka",
  draft: "Draft",
  completed: "Selesai",
  rescheduled: "Dipindah",
  cancelled: "Batal",
};

export const SLOT_STATUS_STYLES: Record<TodaySlotStatus, string> = {
  not_opened: "border-border bg-surface-container-low text-primary",
  draft: "border-primary/30 bg-primary/10 text-primary",
  completed: "border-success/30 bg-success/10 text-success",
  rescheduled: "border-orange-300 bg-orange-100 text-orange-700",
  cancelled: "border-secondary/30 bg-secondary/10 text-secondary",
};

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.some((item) => item === role);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, offset: number): string {
  const date = parseDateKey(dateKey);
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset));
}

export function dateLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return "Hari ini";
  if (dateKey === addDays(todayKey, -1)) return "Kemarin";
  if (dateKey === addDays(todayKey, 1)) return "Besok";
  const date = parseDateKey(dateKey);
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

/** Pelatih hanya boleh memilih hari ini sampai N hari ke belakang; Ketua/Admin bebas. */
export function dateBounds(
  todayKey: string,
  backfillDays: number,
  canPickAnyDate: boolean,
): { min?: string; max?: string } {
  if (canPickAnyDate) return {};
  return { min: addDays(todayKey, -backfillDays), max: todayKey };
}

export function canOpenSlot(slot: TodaySlot): boolean {
  if (slot.status === "cancelled") return false;
  if (slot.status === "rescheduled") return Boolean(slot.rescheduled_to);
  return Boolean(slot.session_id || slot.training_schedule_id);
}

export function canManageSlot(slot: TodaySlot): boolean {
  return slot.status === "not_opened" || slot.status === "draft";
}

/** Id sesi untuk slot: sesi yang ada, sesi pengganti, atau dibuat dari jadwal (idempoten di server). */
export async function resolveSlotSessionId(token: string, slot: TodaySlot): Promise<number | null> {
  if (slot.status === "cancelled") return null;
  if (slot.status === "rescheduled") return slot.rescheduled_to?.id ?? null;
  if (slot.session_id) return slot.session_id;
  if (!slot.training_schedule_id) return null;

  const response = await openAkademiSessionFromSchedule(token, slot.training_schedule_id, slot.date);
  return response.training_session.id;
}

export function sessionFormHref(sessionId: number): string {
  return `/academy/attendance/new?session=${sessionId}`;
}
