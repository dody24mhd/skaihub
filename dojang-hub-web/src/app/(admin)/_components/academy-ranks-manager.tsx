"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  SportRank,
  createAkademiSportRank,
  deleteAkademiSportRank,
  getAkademiSportRanks,
  updateAkademiSportRank,
} from "../_lib/admin-api";
import { builtinRankLabel, rankSystemLabel } from "../_lib/rank-systems";
import RankList, { isBuiltinRank } from "./evaluation/rank-list";
import RankForm, { RankFormValues, emptyRankForm } from "./evaluation/rank-form";
import { SheetModal } from "./ui";
import StatusMessage from "./ui/status-message";

const TOKEN_KEY = "skaihub_admin_token";

// Sama dengan breakpoint `xl` Tailwind: form samping tampil, SheetModal tidak dipakai.
const DESKTOP_FORM_QUERY = "(min-width: 1280px)";

function isDesktopViewport() {
  return typeof window.matchMedia === "function" && window.matchMedia(DESKTOP_FORM_QUERY).matches;
}

export default function AcademyRanksManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<SportRank[]>([]);
  const [form, setForm] = useState<RankFormValues>(emptyRankForm);
  const [editing, setEditing] = useState<SportRank | null>(null);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rankSystem = items.find(isBuiltinRank)?.rank_system ?? null;

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.code, item.label, String(item.sequence)].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
  }, [items, query]);

  async function loadData(activeToken: string) {
    const response = await getAkademiSportRanks(activeToken);
    setItems(response.data);
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
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Gagal memuat tingkatan.")
        )
        .finally(() => setIsLoading(false));
    });
  }, []);

  function resetForm() {
    setEditing(null);
    setForm(emptyRankForm);
    setMessage("");
    setError("");
  }

  function startEdit(item: SportRank, openModal = false) {
    setEditing(item);
    setForm({
      code: item.code,
      label: item.label,
      sequence: String(item.sequence),
      belt_color: item.belt_color ?? "",
      stripe_color: item.stripe_color ?? "",
    });
    setMessage("");
    setError("");
    if (openModal && !isDesktopViewport()) {
      setIsModalOpen(true);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        code: form.code.trim(),
        label: form.label.trim(),
        sequence: Number(form.sequence),
        belt_color: form.belt_color || null,
        stripe_color: form.stripe_color || null,
      };

      if (editing) {
        await updateAkademiSportRank(tokenRef.current, editing.id, payload);
      } else {
        await createAkademiSportRank(tokenRef.current, payload);
      }

      await loadData(tokenRef.current);
      resetForm();
      setIsModalOpen(false);
      setMessage(editing ? "Tingkatan diperbarui." : "Tingkatan ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan tingkatan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: SportRank) {
    const confirmed = window.confirm(`Hapus tingkatan ${item.label}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiSportRank(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) resetForm();
      setMessage("Tingkatan dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus tingkatan.");
    } finally {
      setIsSaving(false);
    }
  }

  const renderFormContent = (idPrefix: string) => (
    <RankForm
      idPrefix={idPrefix}
      form={form}
      setForm={setForm}
      isEditing={Boolean(editing)}
      isSaving={isSaving}
      onSubmit={handleSubmit}
      onCancel={() => {
        resetForm();
        setIsModalOpen(false);
      }}
    />
  );

  if (isLoading) return <p className="text-sm text-muted">Memuat tingkatan...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Sabuk / Tingkatan</h2>
            <p className="mt-1 text-sm text-muted">
              Sistem {rankSystemLabel(rankSystem)}. Sabuk bawaan terkunci; tambahkan sabuk khusus
              dengan urutan di sela-selanya.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="min-h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
              placeholder="Cari tingkatan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Cari tingkatan"
            />
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark xl:hidden"
            >
              + Tambah Tingkatan
            </button>
          </div>
        </div>

        <StatusMessage tone="success" message={message} className="mt-4" />
        <StatusMessage tone="error" message={error} className="mt-4" />

        <div className="mt-5">
          <RankList
            rows={filteredItems}
            builtinLabel={builtinRankLabel(rankSystem)}
            onEdit={(item) => startEdit(item, true)}
            onDelete={handleDelete}
          />
        </div>
      </section>

      {/* Aside Desktop (xl+) */}
      <aside className="card-soft hidden h-fit rounded-lg bg-white p-5 xl:block">
        <p className="label-caps text-secondary">{editing ? "Edit" : "Tambah"}</p>
        <h2 className="font-heading text-lg font-bold text-primary">
          {editing ? editing.label : "Tingkatan Baru"}
        </h2>
        <div className="mt-4">{renderFormContent("desktop")}</div>
      </aside>

      {/* SheetModal Mobile (< xl) */}
      <SheetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editing ? `Edit ${editing.label}` : "Tambah Tingkatan"}
        description="Kelola master sabuk atau level tingkatan siswa."
      >
        {renderFormContent("modal")}
      </SheetModal>
    </div>
  );
}
