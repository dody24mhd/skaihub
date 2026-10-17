import { describe, expect, it } from "vitest";
import { emptyStudentForm, studentFormFromStudent, studentPayloadFromForm } from "../student-form-model";
import { makeStudent } from "./fixtures";

describe("student-form-model", () => {
  it("mengisi form dari data siswa dengan tanggal yyyy-mm-dd dan berat tanpa nol desimal", () => {
    const form = studentFormFromStudent(
      makeStudent({ birth_date: "2010-05-12T00:00:00.000000Z", weight_kg: "42.50", shirt_size: null }),
    );

    expect(form.birth_date).toBe("2010-05-12");
    expect(form.weight_kg).toBe("42.5");
    expect(form.height_cm).toBe("150");
    expect(form.primary_class_id).toBe("1");
    expect(form.current_rank_id).toBe("2");
    expect(form.shirt_size).toBe("");
  });

  it("mengubah form menjadi payload: angka dan string kosong menjadi null", () => {
    const payload = studentPayloadFromForm({
      ...emptyStudentForm,
      name: "Dewi",
      birth_date: "2011-08-20",
      height_cm: "140",
      weight_kg: "35.5",
      primary_class_id: "3",
    });

    expect(payload).toMatchObject({
      name: "Dewi",
      height_cm: 140,
      weight_kg: 35.5,
      primary_class_id: 3,
      current_rank_id: null,
      student_phone: null,
      guardian_phone: null,
      health_notes: null,
      status: "active",
    });
  });
});
