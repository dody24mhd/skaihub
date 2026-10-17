"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Coach,
  TrainingClass,
  TrainingPlace,
  TrainingSchedule,
  createAkademiTrainingSchedule,
  deleteAkademiTrainingSchedule,
  getAkademiClasses,
  getAkademiCoaches,
  getAkademiMe,
  getAkademiTrainingPlaces,
  getAkademiTrainingSchedules,
  updateAkademiTrainingSchedule,
} from "../_lib/admin-api";
import ScheduleFormModal, { ScheduleFormData } from "./attendance/schedule-form-modal";
import { buildScheduleColumns, dayLabels, shortTime } from "./attendance/schedule-columns";
import { PageHeader, ResponsiveList } from "./ui";
import StatusMessage from "./ui/status-message";

const TOKEN_KEY = "skaihub_admin_token";

const emptyForm: ScheduleFormData = {
  class_id: "",
  training_place_id: "",
  coach_ids: [],
  day_of_week: "1",
  starts_at: "",
  ends_at: "",
  is_active: true,
  notes: "",
};

export default function AcademySchedulesManager() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<TrainingSchedule[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [places, setPlaces] = useState<TrainingPlace[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm);
  const [editing, setEditing] = useState<TrainingSchedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [
          item.class?.name,
          item.training_place?.name,
          item.coach?.name,
          ...(item.coaches || []).map((c) => c.name),
          item.notes,
        ]
          .filter(Boolean)
          .some((val) => val?.toLowerCase().includes(keyword));
      const matchesDay =
        dayFilter === "all" || String(item.day_of_week) === dayFilter;
      const matchesClass =
        classFilter === "all" || String(item.class_id) === classFilter;

      return matchesKeyword && matchesDay && matchesClass;
    });
  }, [classFilter, dayFilter, items, query]);

  async function loadData(activeToken: string) {
    const [profileData, scheduleData, classData, placeData, coachData] =
      await Promise.all([
        getAkademiMe(activeToken),
        getAkademiTrainingSchedules(activeToken),
        getAkademiClasses(activeToken),
        getAkademiTrainingPlaces(activeToken),
        getAkademiCoaches(activeToken),
      ]);

    setCanManage(
      ["ketua_akademi", "admin_akademi"].includes(profileData.user.role)
    );
    setItems(scheduleData.data);
    setClasses(classData.data.filter((item) => item.is_active));
    setPlaces(placeData.data.filter((item) => item.is_active));
    setCoaches(coachData.data.filter((item) => item.is_active));
  }

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(activeToken);

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      loadData(activeToken)
        .catch((caught) =>
          setError(
            caught instanceof Error ? caught.message : "Gagal memuat jadwal."
          )
        )
        .finally(() => setIsLoading(false));
    });
  }, []);

  function handleOpenCreate() {
    setEditing(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function handleStartEdit(item: TrainingSchedule) {
    setEditing(item);
    setForm({
      class_id: String(item.class_id),
      training_place_id: item.training_place_id
        ? String(item.training_place_id)
        : "",
      coach_ids: item.coaches?.length
        ? item.coaches.map((c) => String(c.id))
        : item.coach_id
        ? [String(item.coach_id)]
        : [],
      day_of_week: String(item.day_of_week),
      starts_at: shortTime(item.starts_at),
      ends_at: shortTime(item.ends_at),
      is_active: item.is_active,
      notes: item.notes || "",
    });
    setIsModalOpen(true);
    setMessage("");
    setError("");
  }

  function payloadFromForm() {
    return {
      class_id: Number(form.class_id),
      training_place_id: form.training_place_id
        ? Number(form.training_place_id)
        : null,
      coach_ids: form.coach_ids.map(Number),
      day_of_week: Number(form.day_of_week),
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      is_active: form.is_active,
      notes: form.notes || null,
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const activeToken = token || localStorage.getItem(TOKEN_KEY) || "";
      if (editing) {
        await updateAkademiTrainingSchedule(
          activeToken,
          editing.id,
          payloadFromForm()
        );
      } else {
        await createAkademiTrainingSchedule(
          activeToken,
          payloadFromForm()
        );
      }

      await loadData(activeToken);
      setIsModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setMessage(
        editing ? "Jadwal latihan diperbarui." : "Jadwal latihan ditambahkan."
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal menyimpan jadwal."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: TrainingSchedule) {
    const confirmed = window.confirm(
      `Hapus jadwal ${item.class?.name || "kelas ini"} pada ${
        dayLabels[item.day_of_week]
      }?`
    );
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const activeToken = token || localStorage.getItem(TOKEN_KEY) || "";
      await deleteAkademiTrainingSchedule(activeToken, item.id);
      await loadData(activeToken);
      if (editing?.id === item.id) {
        setIsModalOpen(false);
        setEditing(null);
      }
      setMessage("Jadwal latihan dihapus.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal menghapus jadwal."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const columns = buildScheduleColumns({
    canManage,
    onEdit: handleStartEdit,
    onDelete: handleDelete,
  });

  if (isLoading)
    return <p className="text-sm font-medium text-muted">Memuat jadwal latihan...</p>;

  return (
    <div className="space-y-6">
      <section className="border-2 border-border bg-white p-4 sm:p-6">
        <PageHeader
          title="Jadwal Latihan Reguler"
          eyebrow="Operasional"
          description="Pola jadwal reguler tiap kelas. Sesi aktual dan daftar hadir dicatat dari menu Absensi."
          action={
            canManage ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="min-h-11 flex w-full sm:w-auto items-center justify-center border-2 border-primary bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-container active:bg-primary-container/90"
              >
                + Tambah Jadwal
              </button>
            ) : null
          }
        />

        <StatusMessage tone="success" message={message} className="mb-4" />
        <StatusMessage tone="error" message={error} className="mb-4" />

        {/* Filter Bar */}
        <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
          <input
            className="min-h-11 w-full border border-border bg-white px-3.5 text-sm text-primary placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            placeholder="Cari jadwal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="all">Semua hari</option>
            {Object.entries(dayLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 w-full border border-border bg-white px-3 text-sm text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">Semua kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Responsive List: Table on md+, Cards on Mobile */}
        <ResponsiveList
          columns={columns}
          rows={filteredItems}
          getRowKey={(row) => row.id}
          ariaLabel="Daftar Jadwal Latihan"
          emptyState={
            <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
              Belum ada jadwal latihan.
            </div>
          }
        />
      </section>

      {/* Modal Form Tambah / Edit */}
      {canManage ? (
        <ScheduleFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editing={editing}
          form={form}
          setForm={setForm}
          classes={classes}
          places={places}
          coaches={coaches}
          isSaving={isSaving}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
