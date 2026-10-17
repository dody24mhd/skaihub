import { Student } from "../../_lib/admin-api";

export type StudentFormState = {
  name: string;
  gender: "male" | "female";
  birth_date: string;
  joined_date: string;
  status: Student["status"];
  height_cm: string;
  weight_kg: string;
  primary_class_id: string;
  current_rank_id: string;
  student_phone: string;
  guardian_name: string;
  guardian_phone: string;
  photo_url: string;
  address: string;
  shirt_size: string;
  school_name: string;
  school_grade: string;
  health_notes: string;
};

export type StudentFormErrors = Partial<Record<keyof StudentFormState, string>>;

/** Sama dengan StudentController::GUARDIAN_REQUIRED_UNDER_AGE di API. */
export const GUARDIAN_REQUIRED_UNDER_AGE = 17;

export const CONTACT_REQUIRED_MESSAGE = "Isi minimal satu nomor kontak: nomor siswa atau nomor wali.";

export type StudentFieldSetter = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => void;

export const emptyStudentForm: StudentFormState = {
  name: "",
  gender: "male",
  birth_date: "",
  joined_date: new Date().toISOString().slice(0, 10),
  status: "active",
  height_cm: "",
  weight_kg: "",
  primary_class_id: "",
  current_rank_id: "",
  student_phone: "",
  guardian_name: "",
  guardian_phone: "",
  photo_url: "",
  address: "",
  shirt_size: "",
  school_name: "",
  school_grade: "",
  health_notes: "",
};

export function studentFormFromStudent(student: Student): StudentFormState {
  return {
    name: student.name,
    gender: student.gender,
    birth_date: student.birth_date?.slice(0, 10) || "",
    joined_date: student.joined_date?.slice(0, 10) || "",
    status: student.status,
    height_cm: student.height_cm ? String(student.height_cm) : "",
    weight_kg: student.weight_kg ? String(Number(student.weight_kg)) : "",
    primary_class_id: student.primary_class_id ? String(student.primary_class_id) : "",
    current_rank_id: student.current_rank_id ? String(student.current_rank_id) : "",
    student_phone: student.student_phone || "",
    guardian_name: student.guardian_name || "",
    guardian_phone: student.guardian_phone || "",
    photo_url: student.photo_url || "",
    address: student.address || "",
    shirt_size: student.shirt_size || "",
    school_name: student.school_name || "",
    school_grade: student.school_grade || "",
    health_notes: student.health_notes || "",
  };
}

export function studentPayloadFromForm(form: StudentFormState) {
  return {
    name: form.name,
    gender: form.gender,
    birth_date: form.birth_date,
    joined_date: form.joined_date,
    status: form.status,
    height_cm: form.height_cm ? Number(form.height_cm) : null,
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    primary_class_id: form.primary_class_id ? Number(form.primary_class_id) : null,
    current_rank_id: form.current_rank_id ? Number(form.current_rank_id) : null,
    student_phone: form.student_phone || null,
    guardian_name: form.guardian_name || null,
    guardian_phone: form.guardian_phone || null,
    photo_url: form.photo_url || null,
    address: form.address || null,
    shirt_size: form.shirt_size || null,
    school_name: form.school_name || null,
    school_grade: form.school_grade || null,
    health_notes: form.health_notes || null,
  };
}

export function ageOnDate(birthDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const hasHadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);

  return today.getFullYear() - year - (hasHadBirthday ? 0 : 1);
}

export function isGuardianRequired(birthDate: string, today: Date = new Date()): boolean {
  const age = ageOnDate(birthDate, today);

  return age !== null && age < GUARDIAN_REQUIRED_UNDER_AGE;
}

export function validateStudentForm(form: StudentFormState, today: Date = new Date()): StudentFormErrors {
  const errors: StudentFormErrors = {};

  if (!form.student_phone.trim() && !form.guardian_phone.trim()) {
    errors.student_phone = CONTACT_REQUIRED_MESSAGE;
  }

  if (isGuardianRequired(form.birth_date, today)) {
    if (!form.guardian_name.trim()) {
      errors.guardian_name = `Nama wali wajib diisi untuk siswa di bawah ${GUARDIAN_REQUIRED_UNDER_AGE} tahun.`;
    }
    if (!form.guardian_phone.trim()) {
      errors.guardian_phone = `Nomor wali wajib diisi untuk siswa di bawah ${GUARDIAN_REQUIRED_UNDER_AGE} tahun.`;
    }
  }

  return errors;
}
