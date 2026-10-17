import { ReactNode } from "react";
import { SportRank, Student, TrainingClass } from "../../_lib/admin-api";
import { FormField } from "../ui";
import { StudentFieldSetter, StudentFormState } from "./student-form-model";

const controlClass =
  "min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm";

type SectionProps = {
  form: StudentFormState;
  setField: StudentFieldSetter;
};

function FormSection({ eyebrow, title, children }: { eyebrow: string; title?: string; children: ReactNode }) {
  return (
    <section className="card-soft bg-white p-4 sm:p-5">
      <p className="label-caps text-secondary">{eyebrow}</p>
      {title ? <h2 className="font-heading text-lg font-bold text-primary">{title}</h2> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function StudentMainSection({
  form,
  setField,
  title,
  isUploading,
  onPhotoSelected,
}: SectionProps & { title: string; isUploading: boolean; onPhotoSelected: (file: File | null) => void }) {
  return (
    <FormSection eyebrow="Data Utama" title={title}>
      <FormField id="student-name" label="Nama siswa" required value={form.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" />
      <FormField id="student-status" label="Status">
        <select id="student-status" className={controlClass} value={form.status} onChange={(event) => setField("status", event.target.value as Student["status"])}>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="alumni">Alumni</option>
        </select>
      </FormField>
      <FormField id="student-gender" label="Gender">
        <select id="student-gender" className={controlClass} value={form.gender} onChange={(event) => setField("gender", event.target.value as StudentFormState["gender"])}>
          <option value="male">Laki-laki</option>
          <option value="female">Perempuan</option>
        </select>
      </FormField>
      <FormField id="student-birth-date" label="Tanggal lahir" type="date" required value={form.birth_date} onChange={(event) => setField("birth_date", event.target.value)} />
      <FormField id="student-joined-date" label="Tanggal bergabung" type="date" required value={form.joined_date} onChange={(event) => setField("joined_date", event.target.value)} />
      <FormField id="student-photo" label="Foto siswa">
        <input
          id="student-photo"
          className="block min-h-11 w-full py-2 text-sm text-muted"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onPhotoSelected(event.target.files?.[0] || null)}
        />
        {form.photo_url ? <a className="inline-flex text-xs font-bold text-secondary" href={form.photo_url} target="_blank" rel="noreferrer">Foto terupload</a> : null}
        {isUploading ? <span className="block text-xs text-muted">Mengupload...</span> : null}
      </FormField>
    </FormSection>
  );
}

export function StudentTrainingSection({
  form,
  setField,
  classes,
  ranks,
}: SectionProps & { classes: TrainingClass[]; ranks: SportRank[] }) {
  return (
    <FormSection eyebrow="Latihan Dan Fisik">
      <FormField id="student-class" label="Kelas utama">
        <select id="student-class" className={controlClass} value={form.primary_class_id} onChange={(event) => setField("primary_class_id", event.target.value)}>
          <option value="">Belum dipilih</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </FormField>
      <FormField id="student-rank" label="Tingkatan">
        <select id="student-rank" className={controlClass} value={form.current_rank_id} onChange={(event) => setField("current_rank_id", event.target.value)}>
          <option value="">Belum dipilih</option>
          {ranks.map((rank) => <option key={rank.id} value={rank.id}>{rank.label}</option>)}
        </select>
      </FormField>
      <FormField id="student-height" label="Tinggi badan (cm)" type="number" inputMode="numeric" min="0" required value={form.height_cm} onChange={(event) => setField("height_cm", event.target.value)} />
      <FormField id="student-weight" label="Berat badan (kg)" type="number" inputMode="decimal" min="0" step="0.1" required value={form.weight_kg} onChange={(event) => setField("weight_kg", event.target.value)} />
    </FormSection>
  );
}

export function StudentContactSection({ form, setField }: SectionProps) {
  return (
    <FormSection eyebrow="Kontak Dan Sekolah">
      <FormField id="student-phone" label="Nomor siswa" type="tel" inputMode="tel" autoComplete="tel" value={form.student_phone} onChange={(event) => setField("student_phone", event.target.value)} />
      <FormField id="student-shirt" label="Ukuran baju" value={form.shirt_size} onChange={(event) => setField("shirt_size", event.target.value)} />
      <FormField id="student-guardian-name" label="Nama wali" value={form.guardian_name} onChange={(event) => setField("guardian_name", event.target.value)} />
      <FormField id="student-guardian-phone" label="Nomor wali" type="tel" inputMode="tel" value={form.guardian_phone} onChange={(event) => setField("guardian_phone", event.target.value)} />
      <FormField id="student-school" label="Asal sekolah" value={form.school_name} onChange={(event) => setField("school_name", event.target.value)} />
      <FormField id="student-grade" label="Kelas sekolah" value={form.school_grade} onChange={(event) => setField("school_grade", event.target.value)} />
      <FormField id="student-address" label="Alamat" className="md:col-span-2">
        <textarea id="student-address" className={`${controlClass} min-h-20`} value={form.address} onChange={(event) => setField("address", event.target.value)} />
      </FormField>
      <FormField id="student-health" label="Catatan kesehatan" className="md:col-span-2">
        <textarea id="student-health" className={`${controlClass} min-h-20`} value={form.health_notes} onChange={(event) => setField("health_notes", event.target.value)} />
      </FormField>
    </FormSection>
  );
}
