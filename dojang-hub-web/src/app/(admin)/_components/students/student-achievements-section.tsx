"use client";

import { FormEvent, useState } from "react";
import {
  StudentAchievement,
  createAkademiStudentAchievement,
  deleteAkademiStudentAchievement,
  getAkademiStudentAchievements,
  updateAkademiStudentAchievement,
} from "../../_lib/admin-api";
import {
  AchievementFormState,
  achievementFormFromItem,
  achievementPayloadFromForm,
  emptyAchievementForm,
  validateAchievementForm,
} from "./achievement-form";
import AchievementFormModal from "./achievement-form-modal";
import DetailSectionCard from "./detail-section-card";
import { shortDate } from "./format";
import { useStudentList } from "./use-student-list";
import Icon from "../ui/icon";

const itemButtonClass = "inline-flex min-h-11 items-center justify-center border bg-white px-3 text-xs font-bold";

export default function StudentAchievementsSection({
  token,
  studentId,
  canManage,
}: {
  token: string;
  studentId: number;
  canManage: boolean;
}) {
  const { items, setItems, isLoading, error, reload } = useStudentList(
    token,
    studentId,
    getAkademiStudentAchievements,
    "Gagal memuat prestasi.",
  );
  const [editing, setEditing] = useState<StudentAchievement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<AchievementFormState>(emptyAchievementForm);
  const [formError, setFormError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function openForm(item: StudentAchievement | null) {
    setEditing(item);
    setForm(item ? achievementFormFromItem(item) : emptyAchievementForm);
    setFormError("");
    setSaveError("");
    setMessage("");
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateAchievementForm(form);
    setFormError(validationError);
    if (validationError) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const payload = achievementPayloadFromForm(form);
      if (editing) {
        const result = await updateAkademiStudentAchievement(token, studentId, editing.id, payload);
        setItems((current) => current.map((item) => (item.id === editing.id ? result.student_achievement : item)));
      } else {
        const result = await createAkademiStudentAchievement(token, studentId, payload);
        setItems((current) => [result.student_achievement, ...current]);
      }
      setIsFormOpen(false);
      setMessage(editing ? "Prestasi diperbarui." : "Prestasi ditambahkan.");
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Gagal menyimpan prestasi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: StudentAchievement) {
    if (!window.confirm(`Hapus prestasi "${item.title}"?`)) return;

    setMessage("");
    try {
      await deleteAkademiStudentAchievement(token, studentId, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Prestasi dihapus.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Gagal menghapus prestasi.");
    }
  }

  const addButton = canManage ? (
    <button
      className="inline-flex min-h-11 items-center gap-1 bg-primary px-3 text-xs font-bold text-white"
      onClick={() => openForm(null)}
      type="button"
    >
      <Icon name="add" className="text-[18px]" />
      Tambah Prestasi
    </button>
  ) : undefined;

  return (
    <DetailSectionCard title="Prestasi" action={addButton} isLoading={isLoading} error={error} onRetry={reload}>
      {message ? <p className="mt-3 text-sm font-semibold text-primary" role="status">{message}</p> : null}
      {items.length ? (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words font-bold text-primary">{item.title}</p>
                {item.result_label ? (
                  <span className="shrink-0 bg-success/10 px-2 py-1 text-xs font-bold text-success">{item.result_label}</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted">
                {item.event_name || "Tanpa nama event"} - {shortDate(item.achieved_on)}
              </p>
              {item.notes ? <p className="mt-1 break-words text-sm text-muted">{item.notes}</p> : null}
              {canManage ? (
                <div className="mt-2 flex gap-2">
                  <button className={`${itemButtonClass} border-border text-primary`} onClick={() => openForm(item)} type="button" aria-label={`Edit ${item.title}`}>
                    Edit
                  </button>
                  <button className={`${itemButtonClass} border-secondary/30 text-secondary`} onClick={() => handleDelete(item)} type="button" aria-label={`Hapus ${item.title}`}>
                    Hapus
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-sm text-muted">Belum ada prestasi tercatat.</p>
      )}

      <AchievementFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editing)}
        form={form}
        setForm={setForm}
        error={formError}
        saveError={saveError}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </DetailSectionCard>
  );
}
