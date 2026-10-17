import { describe, expect, it } from "vitest";
import {
  ageOnDate,
  emptyStudentForm,
  isGuardianRequired,
  studentFormFromStudent,
  studentPayloadFromForm,
  validateStudentForm,
} from "../student-form-model";
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

  it("tinggi dan berat kosong dikirim sebagai null", () => {
    const payload = studentPayloadFromForm({ ...emptyStudentForm, name: "Dewi" });

    expect(payload.height_cm).toBeNull();
    expect(payload.weight_kg).toBeNull();
  });

  it("form dari siswa tanpa data fisik tetap kosong", () => {
    const form = studentFormFromStudent(makeStudent({ height_cm: null, weight_kg: null }));

    expect(form.height_cm).toBe("");
    expect(form.weight_kg).toBe("");
  });
});

describe("aturan kontak & usia", () => {
  const today = new Date(2026, 9, 17);

  it("menghitung usia dari tanggal lahir", () => {
    expect(ageOnDate("2009-10-17", today)).toBe(17);
    expect(ageOnDate("2009-10-18", today)).toBe(16);
    expect(ageOnDate("", today)).toBeNull();
  });

  it("wali wajib hanya untuk usia di bawah 17 tahun", () => {
    expect(isGuardianRequired("2009-10-18", today)).toBe(true);
    expect(isGuardianRequired("2009-10-17", today)).toBe(false);
    expect(isGuardianRequired("", today)).toBe(false);
  });

  it("wajib minimal satu nomor kontak", () => {
    const errors = validateStudentForm({ ...emptyStudentForm, birth_date: "1990-01-01" }, today);

    expect(errors.student_phone).toBe("Isi minimal satu nomor kontak: nomor siswa atau nomor wali.");
    expect(errors.guardian_name).toBeUndefined();
  });

  it("siswa di bawah 17 tahun wajib nama dan nomor wali", () => {
    const errors = validateStudentForm({ ...emptyStudentForm, birth_date: "2015-01-01", student_phone: "0812" }, today);

    expect(errors.student_phone).toBeUndefined();
    expect(errors.guardian_name).toBe("Nama wali wajib diisi untuk siswa di bawah 17 tahun.");
    expect(errors.guardian_phone).toBe("Nomor wali wajib diisi untuk siswa di bawah 17 tahun.");
  });

  it("lolos bila data lengkap", () => {
    expect(
      validateStudentForm({ ...emptyStudentForm, birth_date: "2015-01-01", guardian_name: "Ibu", guardian_phone: "0812" }, today),
    ).toEqual({});
    expect(validateStudentForm({ ...emptyStudentForm, birth_date: "1990-01-01", student_phone: "0812" }, today)).toEqual({});
  });
});
