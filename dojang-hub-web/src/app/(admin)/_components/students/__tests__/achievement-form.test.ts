import { describe, expect, it } from "vitest";
import { StudentAchievement } from "../../../_lib/admin-api";
import {
  achievementFormFromItem,
  achievementPayloadFromForm,
  emptyAchievementForm,
  validateAchievementForm,
} from "../achievement-form";

const achievement: StudentAchievement = {
  id: 7,
  akademi_id: 1,
  student_id: 1,
  title: "Juara 1 Kyorugi",
  event_name: "Kejurda Jabar",
  achieved_on: "2026-09-14T00:00:00.000000Z",
  result_label: "Emas",
  notes: null,
  created_at: "2026-09-15T00:00:00Z",
  updated_at: "2026-09-15T00:00:00Z",
};

describe("achievement-form", () => {
  it("mengisi form edit dengan tanggal yyyy-mm-dd dan string kosong untuk null", () => {
    expect(achievementFormFromItem(achievement)).toEqual({
      title: "Juara 1 Kyorugi",
      event_name: "Kejurda Jabar",
      achieved_on: "2026-09-14",
      result_label: "Emas",
      notes: "",
    });
  });

  it("merapikan spasi dan mengubah field opsional kosong menjadi null", () => {
    expect(
      achievementPayloadFromForm({ ...emptyAchievementForm, title: "  Juara 2 Poomsae ", result_label: " " }),
    ).toEqual({
      title: "Juara 2 Poomsae",
      event_name: null,
      achieved_on: null,
      result_label: null,
      notes: null,
    });
  });

  it("mewajibkan judul prestasi", () => {
    expect(validateAchievementForm({ ...emptyAchievementForm, title: "   " })).toBe("Judul prestasi wajib diisi.");
    expect(validateAchievementForm({ ...emptyAchievementForm, title: "Juara" })).toBe("");
  });
});
