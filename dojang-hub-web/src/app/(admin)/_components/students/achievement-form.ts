import { StudentAchievement, StudentAchievementPayload } from "../../_lib/admin-api";

export type AchievementFormState = {
  title: string;
  event_name: string;
  achieved_on: string;
  result_label: string;
  notes: string;
};

export const emptyAchievementForm: AchievementFormState = {
  title: "",
  event_name: "",
  achieved_on: "",
  result_label: "",
  notes: "",
};

export function achievementFormFromItem(item: StudentAchievement): AchievementFormState {
  return {
    title: item.title,
    event_name: item.event_name || "",
    achieved_on: item.achieved_on?.slice(0, 10) || "",
    result_label: item.result_label || "",
    notes: item.notes || "",
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function achievementPayloadFromForm(form: AchievementFormState): StudentAchievementPayload {
  return {
    title: form.title.trim(),
    event_name: optional(form.event_name),
    achieved_on: optional(form.achieved_on),
    result_label: optional(form.result_label),
    notes: optional(form.notes),
  };
}

export function validateAchievementForm(form: AchievementFormState) {
  return form.title.trim() ? "" : "Judul prestasi wajib diisi.";
}
