"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

const TOKEN_KEY = "skaihub_admin_token";

const dayLabels: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

type ScheduleForm = {
  class_id: string;
  training_place_id: string;
  coach_ids: string[];
  day_of_week: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  notes: string;
};

const emptyForm: ScheduleForm = {
  class_id: "",
  training_place_id: "",
  coach_ids: [],
  day_of_week: "1",
  starts_at: "",
  ends_at: "",
  is_active: true,
  notes: "",
};

function shortTime(value: string) {
  return value.slice(0, 5);
}

export default function AcademySchedulesManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<TrainingSchedule[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [places, setPlaces] = useState<TrainingPlace[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editing, setEditing] = useState<TrainingSchedule | null>(null);
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
        [item.class?.name, item.training_place?.name, item.coach?.name, ...(item.coaches || []).map((coach) => coach.name), item.notes]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(keyword));
      const matchesDay = dayFilter === "all" || String(item.day_of_week) === dayFilter;
      const matchesClass = classFilter === "all" || String(item.class_id) === classFilter;

      return matchesKeyword && matchesDay && matchesClass;
    });
  }, [classFilter, dayFilter, items, query]);

  async function loadData(activeToken: string) {
    const [profileData, scheduleData, classData, placeData, coachData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiTrainingSchedules(activeToken),
      getAkademiClasses(activeToken),
      getAkademiTrainingPlaces(activeToken),
      getAkademiCoaches(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setItems(scheduleData.data);
    setClasses(classData.data.filter((item) => item.is_active));
    setPlaces(placeData.data.filter((item) => item.is_active));
    setCoaches(coachData.data.filter((item) => item.is_active));
  }

  useEffect(() => {
    queueMicrotask(() => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || "";
      tokenRef.current = activeToken;

      if (!activeToken) {
        setError("Sesi tidak ditemukan. Silakan login ulang.");
        setIsLoading(false);
        return;
      }

      loadData(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat jadwal."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
  }

  function startEdit(item: TrainingSchedule) {
    setEditing(item);
    setForm({
      class_id: String(item.class_id),
      training_place_id: item.training_place_id ? String(item.training_place_id) : "",
      coach_ids: (item.coaches?.length ? item.coaches.map((coach) => String(coach.id)) : item.coach_id ? [String(item.coach_id)] : []),
      day_of_week: String(item.day_of_week),
      starts_at: shortTime(item.starts_at),
      ends_at: shortTime(item.ends_at),
      is_active: item.is_active,
      notes: item.notes || "",
    });
    setMessage("");
    setError("");
  }

  function payloadFromForm() {
    return {
      class_id: Number(form.class_id),
      training_place_id: form.training_place_id ? Number(form.training_place_id) : null,
      coach_ids: form.coach_ids.map(Number),
      day_of_week: Number(form.day_of_week),
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      is_active: form.is_active,
      notes: form.notes || null,
    };
  }

  function toggleCoach(coachId: number) {
    const value = String(coachId);
    setForm((current) => ({
      ...current,
      coach_ids: current.coach_ids.includes(value)
        ? current.coach_ids.filter((id) => id !== value)
        : [...current.coach_ids, value],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      if (editing) {
        await updateAkademiTrainingSchedule(tokenRef.current, editing.id, payloadFromForm());
      } else {
        await createAkademiTrainingSchedule(tokenRef.current, payloadFromForm());
      }

      await loadData(tokenRef.current);
      resetForm();
      setMessage(editing ? "Jadwal latihan diperbarui." : "Jadwal latihan ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan jadwal.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: TrainingSchedule) {
    const confirmed = window.confirm(`Hapus jadwal ${item.class?.name || "kelas ini"} pada ${dayLabels[item.day_of_week]}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiTrainingSchedule(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Jadwal latihan dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus jadwal.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat jadwal latihan...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-6">
        <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Operasional</p>
            <h2 className="font-heading text-xl font-bold text-primary">Jadwal Latihan Reguler</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari jadwal" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
              <option value="all">Semua hari</option>
              {Object.entries(dayLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">Semua kelas</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Hari</th>
                <th className="pb-3">Jam</th>
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Tempat</th>
                <th className="pb-3">Pelatih</th>
                <th className="pb-3">Status</th>
                {canManage ? <th className="pb-3 text-right">Aksi</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-bold text-primary">{dayLabels[item.day_of_week]}</td>
                  <td className="py-3 text-muted">{shortTime(item.starts_at)} - {shortTime(item.ends_at)}</td>
                  <td className="py-3 text-muted">{item.class?.name || "-"}</td>
                  <td className="py-3 text-muted">{item.training_place?.name || item.class?.training_place?.name || "-"}</td>
                  <td className="py-3 text-muted">
                    {item.coaches?.length ? item.coaches.map((coach) => coach.name).join(", ") : item.coach?.name || "Belum dipilih"}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.is_active ? "bg-success/10 text-success" : "bg-surface-container text-muted"}`}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="py-3 text-right">
                      <button className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" onClick={() => startEdit(item)} type="button">Edit</button>
                      <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleDelete(item)} type="button">Hapus</button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!filteredItems.length ? (
                <tr>
                  <td className="py-8 text-sm text-muted" colSpan={canManage ? 7 : 6}>Belum ada jadwal latihan.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </section>
      </div>

      {canManage ? (
        <aside className="space-y-6">
          <section className="card-soft rounded-lg bg-white p-5">
              <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
              <h2 className="font-heading text-lg font-bold text-primary">{editing ? "Jadwal Latihan" : "Jadwal Reguler Baru"}</h2>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold text-primary">
                  Kelas
                  <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.class_id} onChange={(event) => setForm((current) => ({ ...current, class_id: event.target.value }))} required>
                    <option value="">Pilih kelas</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-primary">
                  Hari
                  <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.day_of_week} onChange={(event) => setForm((current) => ({ ...current, day_of_week: event.target.value }))}>
                    {Object.entries(dayLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-primary">
                    Mulai
                    <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="time" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} required />
                  </label>
                  <label className="block text-sm font-semibold text-primary">
                    Selesai
                    <input className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" type="time" value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} required />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-primary">
                  Tempat latihan
                  <select className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={form.training_place_id} onChange={(event) => setForm((current) => ({ ...current, training_place_id: event.target.value }))}>
                    <option value="">Ikuti tempat kelas</option>
                    {places.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <fieldset className="block text-sm font-semibold text-primary">
                  <legend>Pelatih default</legend>
                  <div className="mt-2 grid gap-2 rounded-md border border-border p-3">
                    {coaches.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm font-medium text-primary">
                        <input type="checkbox" checked={form.coach_ids.includes(String(item.id))} onChange={() => toggleCoach(item.id)} />
                        {item.name}
                      </label>
                    ))}
                    {!coaches.length ? <p className="text-sm text-muted">Belum ada pelatih aktif.</p> : null}
                  </div>
                </fieldset>
                <label className="block text-sm font-semibold text-primary">
                  Catatan
                  <textarea className="mt-2 min-h-20 w-full rounded-md border border-border p-3 text-sm outline-none focus:border-primary" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                  Aktif
                </label>
                <div className="flex gap-2">
                  <button className="h-11 flex-1 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:bg-muted" disabled={isSaving} type="submit">{isSaving ? "Menyimpan..." : "Simpan"}</button>
                  {editing ? <button className="h-11 rounded-md border border-border px-4 text-sm font-bold text-primary" onClick={resetForm} type="button">Batal</button> : null}
                </div>
              </form>
            </section>
        </aside>
      ) : null}
    </div>
  );
}
