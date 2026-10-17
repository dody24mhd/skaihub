"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  SportRank,
  Student,
  TrainingClass,
  createAkademiStudent,
  getAkademiClasses,
  getAkademiMe,
  getAkademiSportRanks,
  getAkademiStudentDetail,
  updateAkademiStudent,
  uploadAkademiFile,
} from "../_lib/admin-api";
import {
  StudentFieldSetter,
  StudentFormState,
  emptyStudentForm,
  studentFormFromStudent,
  studentPayloadFromForm,
  validateStudentForm,
} from "./students/student-form-model";
import { StudentContactSection, StudentMainSection, StudentTrainingSection } from "./students/student-form-sections";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

export default function AcademyStudentFormManager({ studentId }: { studentId?: number }) {
  const router = useRouter();
  const tokenRef = useRef("");
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [ranks, setRanks] = useState<SportRank[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyStudentForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const isEditing = Boolean(studentId);
  const fieldErrors = hasTriedSubmit ? validateStudentForm(form) : {};

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setLoadError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      Promise.all([
        getAkademiMe(activeToken),
        getAkademiClasses(activeToken),
        getAkademiSportRanks(activeToken),
        studentId ? getAkademiStudentDetail(activeToken, studentId) : Promise.resolve(null),
      ])
        .then(([profileData, classData, rankData, detailData]) => {
          if (!["ketua_akademi", "admin_akademi"].includes(profileData.user.role)) {
            setLoadError("Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data siswa.");
            return;
          }

          setClasses(classData.data);
          setRanks(rankData.data);
          if (detailData) {
            setStudent(detailData.student);
            setForm(studentFormFromStudent(detailData.student));
          }
        })
        .catch((caught) => setLoadError(caught instanceof Error ? caught.message : "Gagal memuat form siswa."))
        .finally(() => setIsLoading(false));
    });
  }, [studentId]);

  const setField: StudentFieldSetter = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const result = await uploadAkademiFile(tokenRef.current, file, "student_photo");
      setForm((current) => ({ ...current, photo_url: result.url }));
      setMessage("Foto siswa terupload.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal upload foto siswa.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasTriedSubmit(true);
    setError("");
    setMessage("");

    if (Object.keys(validateStudentForm(form)).length) {
      setError("Periksa kembali kontak dan data wali yang ditandai.");
      return;
    }

    setIsSaving(true);

    try {
      if (studentId) {
        await updateAkademiStudent(tokenRef.current, studentId, studentPayloadFromForm(form));
        setMessage("Siswa diperbarui.");
        router.push(`/academy/students/${studentId}`);
      } else {
        await createAkademiStudent(tokenRef.current, studentPayloadFromForm(form));
        setMessage("Siswa ditambahkan.");
        router.push("/academy/students");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan siswa.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat form siswa...</p>;

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link className="inline-flex min-h-11 items-center gap-2 border border-border bg-white px-3 text-sm font-bold text-primary" href="/academy/students">
          <Icon name="arrow_back" className="text-[18px]" />
          Daftar Siswa
        </Link>
        <p className="border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">{loadError}</p>
      </div>
    );
  }

  const backHref = studentId ? `/academy/students/${studentId}` : "/academy/students";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        <Link className="inline-flex min-h-11 w-fit items-center gap-2 border border-border bg-white px-3 text-sm font-bold text-primary" href={backHref}>
          <Icon name="arrow_back" className="text-[18px]" />
          {studentId ? "Detail Siswa" : "Daftar Siswa"}
        </Link>
        <button className="hidden min-h-11 items-center justify-center gap-2 bg-primary px-4 text-sm font-bold text-white disabled:bg-muted sm:inline-flex" disabled={isSaving} type="submit">
          <Icon name="save" className="text-[18px]" />
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message ? <p className="border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
      {error ? <p className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

      <StudentMainSection
        form={form}
        setField={setField}
        title={isEditing ? student?.name || "Edit Siswa" : "Siswa Baru"}
        isUploading={isUploading}
        onPhotoSelected={handlePhotoUpload}
      />
      <StudentTrainingSection form={form} setField={setField} classes={classes} ranks={ranks} />
      <StudentContactSection form={form} setField={setField} errors={fieldErrors} />

      <div className="sticky bottom-16 z-10 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border bg-surface py-3 md:bottom-0 md:flex md:justify-end md:py-4">
        <Link className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-4 text-sm font-bold text-primary" href={backHref}>
          Batal
        </Link>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
          <Icon name="save" className="text-[18px]" />
          {isSaving ? "Menyimpan..." : "Simpan Siswa"}
        </button>
      </div>
    </form>
  );
}
