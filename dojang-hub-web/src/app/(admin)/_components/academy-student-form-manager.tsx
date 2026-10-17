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

const TOKEN_KEY = "skaihub_admin_token";

type StudentForm = {
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

const emptyForm: StudentForm = {
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

function formFromStudent(student: Student): StudentForm {
  return {
    name: student.name,
    gender: student.gender,
    birth_date: student.birth_date?.slice(0, 10) || "",
    joined_date: student.joined_date?.slice(0, 10) || "",
    status: student.status,
    height_cm: String(student.height_cm || ""),
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

export default function AcademyStudentFormManager({ studentId }: { studentId?: number }) {
  const router = useRouter();
  const tokenRef = useRef("");
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [ranks, setRanks] = useState<SportRank[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isEditing = Boolean(studentId);

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
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
            setError("Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data siswa.");
            return;
          }

          setClasses(classData.data);
          setRanks(rankData.data);
          if (detailData) {
            setStudent(detailData.student);
            setForm(formFromStudent(detailData.student));
          }
        })
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat form siswa."))
        .finally(() => setIsLoading(false));
    });
  }, [studentId]);

  function payloadFromForm() {
    return {
      name: form.name,
      gender: form.gender,
      birth_date: form.birth_date,
      joined_date: form.joined_date,
      status: form.status,
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
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
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      if (studentId) {
        await updateAkademiStudent(tokenRef.current, studentId, payloadFromForm());
        setMessage("Siswa diperbarui.");
        router.push(`/academy/students/${studentId}`);
      } else {
        await createAkademiStudent(tokenRef.current, payloadFromForm());
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

  if (error && !classes.length) {
    return (
      <div className="space-y-4">
        <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary" href="/academy/students">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Daftar Siswa
        </Link>
        <p className="rounded-md border border-secondary/20 bg-secondary/5 p-4 text-sm font-semibold text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-primary" href={studentId ? `/academy/students/${studentId}` : "/academy/students"}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {studentId ? "Detail Siswa" : "Daftar Siswa"}
        </Link>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
          <span className="material-symbols-outlined text-[18px]">save</span>
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message ? <p className="rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
      {error ? <p className="rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

      <section className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Data Utama</p>
        <h2 className="font-heading text-lg font-bold text-primary">{isEditing ? student?.name || "Edit Siswa" : "Siswa Baru"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-primary">
            Nama siswa
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Status
            <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Student["status"] }))}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="alumni">Alumni</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-primary">
            Gender
            <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as "male" | "female" }))}>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-primary">
            Tanggal lahir
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="date" value={form.birth_date} onChange={(event) => setForm((current) => ({ ...current, birth_date: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Tanggal bergabung
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="date" value={form.joined_date} onChange={(event) => setForm((current) => ({ ...current, joined_date: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Foto siswa
            <input className="mt-2 block w-full text-sm text-muted" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handlePhotoUpload(event.target.files?.[0] || null)} />
            {form.photo_url ? <a className="mt-2 inline-flex text-xs font-bold text-secondary" href={form.photo_url} target="_blank" rel="noreferrer">Foto terupload</a> : null}
            {isUploading ? <span className="mt-2 block text-xs text-muted">Mengupload...</span> : null}
          </label>
        </div>
      </section>

      <section className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Latihan Dan Fisik</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-primary">
            Kelas utama
            <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.primary_class_id} onChange={(event) => setForm((current) => ({ ...current, primary_class_id: event.target.value }))}>
              <option value="">Belum dipilih</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-primary">
            Tingkatan
            <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.current_rank_id} onChange={(event) => setForm((current) => ({ ...current, current_rank_id: event.target.value }))}>
              <option value="">Belum dipilih</option>
              {ranks.map((rank) => <option key={rank.id} value={rank.id}>{rank.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-primary">
            Tinggi badan
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="number" value={form.height_cm} onChange={(event) => setForm((current) => ({ ...current, height_cm: event.target.value }))} required />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Berat badan
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="number" value={form.weight_kg} onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))} required />
          </label>
        </div>
      </section>

      <section className="card-soft rounded-lg bg-white p-5">
        <p className="label-caps text-secondary">Kontak Dan Sekolah</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-primary">
            Nomor siswa
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.student_phone} onChange={(event) => setForm((current) => ({ ...current, student_phone: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Ukuran baju
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.shirt_size} onChange={(event) => setForm((current) => ({ ...current, shirt_size: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Nama wali
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.guardian_name} onChange={(event) => setForm((current) => ({ ...current, guardian_name: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Nomor wali
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.guardian_phone} onChange={(event) => setForm((current) => ({ ...current, guardian_phone: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Asal sekolah
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.school_name} onChange={(event) => setForm((current) => ({ ...current, school_name: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Kelas sekolah
            <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.school_grade} onChange={(event) => setForm((current) => ({ ...current, school_grade: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary md:col-span-2">
            Alamat
            <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-primary" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <label className="block text-sm font-semibold text-primary md:col-span-2">
            Catatan kesehatan
            <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-primary" value={form.health_notes} onChange={(event) => setForm((current) => ({ ...current, health_notes: event.target.value }))} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-border bg-surface/95 py-4 backdrop-blur">
        <Link className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary" href={studentId ? `/academy/students/${studentId}` : "/academy/students"}>
          Batal
        </Link>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">
          <span className="material-symbols-outlined text-[18px]">save</span>
          {isSaving ? "Menyimpan..." : "Simpan Siswa"}
        </button>
      </div>
    </form>
  );
}
