"use client";

import { useState } from "react";
import {
  PublicAchievement,
  addAkademiPublicAchievement,
  deleteAkademiPublicAchievement,
  updateAkademiPublicAchievement,
} from "../../../_lib/admin-api";
import { FormField } from "../../ui";
import Icon from "../../ui/icon";

type ProfileAchievementsSectionProps = {
  achievements: PublicAchievement[];
  token: string;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
};

export default function ProfileAchievementsSection({
  achievements,
  token,
  onRefresh,
  onNotify,
  onError,
}: ProfileAchievementsSectionProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingAchievement, setEditingAchievement] = useState<PublicAchievement | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    try {
      await addAkademiPublicAchievement(token, {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        achieved_on: newDate || null,
      });
      await onRefresh();
      setNewTitle("");
      setNewDescription("");
      setNewDate("");
      onNotify("Prestasi akademi ditambahkan.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal menambahkan prestasi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAchievement || !editingAchievement.title.trim()) return;

    setSaving(true);
    try {
      await updateAkademiPublicAchievement(token, editingAchievement.id, {
        title: editingAchievement.title.trim(),
        description: editingAchievement.description?.trim() || null,
        achieved_on: editingAchievement.achieved_on || null,
      });
      await onRefresh();
      setEditingAchievement(null);
      onNotify("Prestasi diperbarui.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal memperbarui prestasi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(achievement: PublicAchievement) {
    if (!window.confirm(`Hapus prestasi "${achievement.title}"?`)) return;
    try {
      await deleteAkademiPublicAchievement(token, achievement.id);
      await onRefresh();
      onNotify("Prestasi dihapus.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal menghapus prestasi.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-white p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
          Tambah Prestasi Baru
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <FormField
            id="achievement-title"
            label="Judul Prestasi"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Contoh: Juara Umum Kejuaraan Taekwondo Nasional 2025"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="achievement-desc" className="text-xs font-bold uppercase tracking-wide text-primary">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              id="achievement-desc"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Rincian perolehan medali, kategori, atau nama atlet..."
              className="w-full border border-border-strong bg-white p-3.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <FormField
                id="achievement-date"
                label="Tanggal Prestasi"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newTitle.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-secondary px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              <Icon name="add" className="text-[20px]" />
              Tambah Prestasi
            </button>
          </div>
        </form>
      </div>

      <div className="border border-border bg-white p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
          Daftar Prestasi Publik
        </h3>

        {achievements.length === 0 ? (
          <div className="border-2 border-dashed border-border p-8 text-center text-sm font-medium text-muted">
            Belum ada prestasi yang dicatat. Tambahkan prestasi untuk membangun reputasi akademi.
          </div>
        ) : (
          <div className="divide-y divide-border border border-border">
            {achievements.map((item) => (
              <div key={item.id} className="p-4">
                {editingAchievement?.id === item.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <FormField
                      id={`edit-ach-title-${item.id}`}
                      label="Judul Prestasi"
                      required
                      value={editingAchievement.title}
                      onChange={(e) =>
                        setEditingAchievement((p) => (p ? { ...p, title: e.target.value } : p))
                      }
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`edit-ach-desc-${item.id}`}
                        className="text-xs font-bold uppercase tracking-wide text-primary"
                      >
                        Keterangan
                      </label>
                      <textarea
                        id={`edit-ach-desc-${item.id}`}
                        rows={2}
                        value={editingAchievement.description ?? ""}
                        onChange={(e) =>
                          setEditingAchievement((p) =>
                            p ? { ...p, description: e.target.value || null } : p,
                          )
                        }
                        className="w-full border border-border bg-white p-3 text-sm text-primary"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={editingAchievement.achieved_on ? editingAchievement.achieved_on.slice(0, 10) : ""}
                        onChange={(e) =>
                          setEditingAchievement((p) =>
                            p ? { ...p, achieved_on: e.target.value || null } : p,
                          )
                        }
                        className="min-h-11 border border-border bg-white px-3 text-sm text-primary"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-h-11 items-center justify-center bg-secondary px-5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAchievement(null)}
                        className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-4 text-xs font-bold text-muted transition hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-primary">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-muted leading-relaxed">{item.description}</p>
                      ) : null}
                      {item.achieved_on ? (
                        <p className="mt-1.5 text-[11px] font-semibold text-secondary">
                          {new Date(item.achieved_on).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAchievement(item)}
                        className="inline-flex min-h-11 items-center justify-center border border-border px-3.5 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3.5 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
