"use client";

import { FormEvent, useState } from "react";
import { EvaluationAspect, EvaluationPeriod } from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";
import EvaluationAspectModal from "./evaluation-aspect-modal";
import EvaluationPeriodModal from "./evaluation-period-modal";
import EvaluationSettingsAside from "./evaluation-settings-aside";
import { shortDate, statusLabels, statusStyles } from "./evaluation-types";

export type EvaluationSettingsViewProps = {
  periods: EvaluationPeriod[];
  selectedPeriod: EvaluationPeriod | null;
  aspects: EvaluationAspect[];
  activePeriod: EvaluationPeriod | null;
  isPeriodDetailOpen: boolean;
  setIsPeriodDetailOpen: (open: boolean) => void;
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  periodName: string;
  setPeriodName: (val: string) => void;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
  aspectName: string;
  setAspectName: (val: string) => void;
  aspectCategory: string;
  setAspectCategory: (val: string) => void;
  editingAspectId: number | null;
  editingAspectName: string;
  setEditingAspectName: (val: string) => void;
  editingAspectCategory: string;
  setEditingAspectCategory: (val: string) => void;
  isSaving: boolean;
  message: string;
  error: string;
  onUpdatePeriodStatus: (period: EvaluationPeriod, status: EvaluationPeriod["status"]) => Promise<void>;
  onCreatePeriod: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCreateAspect: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onStartEditAspect: (aspect: EvaluationAspect) => void;
  onCancelEditAspect: () => void;
  onUpdateAspect: (aspect: EvaluationAspect) => Promise<void>;
  onDeleteAspect: (aspect: EvaluationAspect) => Promise<void>;
};

export default function EvaluationSettingsView({
  periods,
  selectedPeriod,
  aspects,
  activePeriod,
  isPeriodDetailOpen,
  setIsPeriodDetailOpen,
  selectedPeriodId,
  setSelectedPeriodId,
  periodName,
  setPeriodName,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  aspectName,
  setAspectName,
  aspectCategory,
  setAspectCategory,
  editingAspectId,
  editingAspectName,
  setEditingAspectName,
  editingAspectCategory,
  setEditingAspectCategory,
  isSaving,
  message,
  error,
  onUpdatePeriodStatus,
  onCreatePeriod,
  onCreateAspect,
  onStartEditAspect,
  onCancelEditAspect,
  onUpdateAspect,
  onDeleteAspect,
}: EvaluationSettingsViewProps) {
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [isAddAspectModalOpen, setIsAddAspectModalOpen] = useState(false);
  const [editingAspectModalItem, setEditingAspectModalItem] = useState<EvaluationAspect | null>(null);

  const periodColumns: ResponsiveColumn<EvaluationPeriod>[] = [
    {
      key: "name",
      header: "Periode",
      primary: true,
      render: (p) => (
        <div>
          <p className="font-bold text-primary">{p.name}</p>
          <p className="text-xs text-muted">
            {shortDate(p.starts_at)} sampai {shortDate(p.ends_at)} · {p.aspects_count || 0} variabel
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[p.status]}`}>
          {statusLabels[p.status]}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (p) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {p.status !== "active" ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
              disabled={isSaving}
              onClick={() => onUpdatePeriodStatus(p, "active")}
              type="button"
            >
              Aktifkan
            </button>
          ) : (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:bg-surface-container disabled:bg-muted"
              disabled={isSaving}
              onClick={() => onUpdatePeriodStatus(p, "closed")}
              type="button"
            >
              Arsipkan
            </button>
          )}
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container"
            type="button"
            onClick={() => {
              setSelectedPeriodId(String(p.id));
              setIsPeriodDetailOpen(true);
            }}
          >
            Kelola -&gt;
          </button>
        </div>
      ),
    },
  ];

  const aspectColumns: ResponsiveColumn<EvaluationAspect>[] = [
    {
      key: "name",
      header: "Variabel",
      primary: true,
      render: (a) => (
        <div>
          <p className="font-bold text-primary">{a.name}</p>
          <p className="text-xs text-muted">{a.category || "Tanpa kategori"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
            a.is_active ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
          }`}
        >
          {a.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (a) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary disabled:bg-muted"
            disabled={isSaving}
            onClick={() => {
              onStartEditAspect(a);
              setEditingAspectModalItem(a);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10 disabled:bg-muted"
            disabled={isSaving}
            onClick={() => onDeleteAspect(a)}
            type="button"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Periode</p>
          <p className="mt-2 text-2xl font-black text-primary">{periods.length}</p>
          <p className="text-sm text-muted">Periode penilaian tersimpan</p>
        </article>
        <article className="card-soft rounded-lg bg-white p-5">
          <p className="label-caps text-secondary">Periode Aktif</p>
          <p className="mt-2 text-lg font-black text-primary">{activePeriod?.name || "-"}</p>
          <p className="text-sm text-muted">Hanya satu periode bisa aktif</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-6">
          <div className="card-soft rounded-lg bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label-caps text-secondary">Periode Penilaian</p>
                <h2 className="font-heading text-xl font-bold text-primary">
                  {isPeriodDetailOpen ? selectedPeriod?.name || "Detail Periode" : "Daftar Periode"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isPeriodDetailOpen ? (
                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary sm:w-auto"
                    type="button"
                    onClick={() => setIsPeriodDetailOpen(false)}
                  >
                    &lt;- Kembali ke Periode
                  </button>
                ) : (
                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark xl:hidden"
                    type="button"
                    onClick={() => setIsAddPeriodModalOpen(true)}
                  >
                    + Buat Periode
                  </button>
                )}
                {isPeriodDetailOpen && selectedPeriod ? (
                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary-dark xl:hidden"
                    type="button"
                    onClick={() => setIsAddAspectModalOpen(true)}
                  >
                    + Tambah Variabel
                  </button>
                ) : null}
              </div>
            </div>

            {message ? (
              <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
                {error}
              </p>
            ) : null}

            {isPeriodDetailOpen && selectedPeriod ? (
              <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{selectedPeriod.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyles[selectedPeriod.status]}`}>
                      {statusLabels[selectedPeriod.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {shortDate(selectedPeriod.starts_at)} - {shortDate(selectedPeriod.ends_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPeriod.status !== "active" ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-xs font-bold text-white disabled:bg-muted"
                      disabled={isSaving}
                      onClick={() => onUpdatePeriodStatus(selectedPeriod, "active")}
                      type="button"
                    >
                      Aktifkan
                    </button>
                  ) : null}
                  {selectedPeriod.status !== "closed" ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-xs font-bold text-primary disabled:bg-muted"
                      disabled={isSaving}
                      onClick={() => onUpdatePeriodStatus(selectedPeriod, "closed")}
                      type="button"
                    >
                      Arsipkan
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              {!isPeriodDetailOpen ? (
                <ResponsiveList
                  columns={periodColumns}
                  rows={periods}
                  getRowKey={(p) => p.id}
                  ariaLabel="Daftar Periode Penilaian"
                  emptyState={
                    <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
                      Belum ada periode penilaian.
                    </div>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-bold text-primary">
                    Variabel Periode Ini ({aspects.length})
                  </h3>
                  <ResponsiveList
                    columns={aspectColumns}
                    rows={aspects}
                    getRowKey={(a) => a.id}
                    ariaLabel="Daftar Variabel Penilaian"
                    emptyState={
                      <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
                        Belum ada variabel untuk periode ini.
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <EvaluationSettingsAside
          isPeriodDetailOpen={isPeriodDetailOpen}
          periodName={periodName}
          setPeriodName={setPeriodName}
          periodStart={periodStart}
          setPeriodStart={setPeriodStart}
          periodEnd={periodEnd}
          setPeriodEnd={setPeriodEnd}
          aspectName={aspectName}
          setAspectName={setAspectName}
          aspectCategory={aspectCategory}
          setAspectCategory={setAspectCategory}
          isSaving={isSaving}
          selectedPeriodId={selectedPeriodId}
          onCreatePeriod={onCreatePeriod}
          onCreateAspect={onCreateAspect}
        />
      </div>

      <EvaluationPeriodModal
        isOpen={isAddPeriodModalOpen}
        onClose={() => setIsAddPeriodModalOpen(false)}
        periodName={periodName}
        setPeriodName={setPeriodName}
        periodStart={periodStart}
        setPeriodStart={setPeriodStart}
        periodEnd={periodEnd}
        setPeriodEnd={setPeriodEnd}
        isSaving={isSaving}
        onCreatePeriod={onCreatePeriod}
      />

      <EvaluationAspectModal
        isAddOpen={isAddAspectModalOpen}
        onCloseAdd={() => setIsAddAspectModalOpen(false)}
        aspectName={aspectName}
        setAspectName={setAspectName}
        aspectCategory={aspectCategory}
        setAspectCategory={setAspectCategory}
        selectedPeriodId={selectedPeriodId}
        onCreateAspect={onCreateAspect}
        editingAspect={editingAspectId ? editingAspectModalItem : null}
        editingAspectName={editingAspectName}
        setEditingAspectName={setEditingAspectName}
        editingAspectCategory={editingAspectCategory}
        setEditingAspectCategory={setEditingAspectCategory}
        onCloseEdit={() => {
          onCancelEditAspect();
          setEditingAspectModalItem(null);
        }}
        onUpdateAspect={onUpdateAspect}
        isSaving={isSaving}
      />
    </div>
  );
}
