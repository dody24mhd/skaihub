"use client";

import { FormEvent } from "react";
import { EvaluationAspect } from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";

export type EvaluationAspectModalProps = {
  isAddOpen: boolean;
  onCloseAdd: () => void;
  aspectName: string;
  setAspectName: (val: string) => void;
  aspectCategory: string;
  setAspectCategory: (val: string) => void;
  selectedPeriodId: string;
  onCreateAspect: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  editingAspect: EvaluationAspect | null;
  editingAspectName: string;
  setEditingAspectName: (val: string) => void;
  editingAspectCategory: string;
  setEditingAspectCategory: (val: string) => void;
  onCloseEdit: () => void;
  onUpdateAspect: (aspect: EvaluationAspect) => Promise<void>;
  isSaving: boolean;
};

export default function EvaluationAspectModal({
  isAddOpen,
  onCloseAdd,
  aspectName,
  setAspectName,
  aspectCategory,
  setAspectCategory,
  selectedPeriodId,
  onCreateAspect,
  editingAspect,
  editingAspectName,
  setEditingAspectName,
  editingAspectCategory,
  setEditingAspectCategory,
  onCloseEdit,
  onUpdateAspect,
  isSaving,
}: EvaluationAspectModalProps) {
  return (
    <>
      {/* Modal Tambah Variabel */}
      <SheetModal
        isOpen={isAddOpen}
        onClose={onCloseAdd}
        title="Tambah Variabel Penilaian"
        description="Tambahkan aspek penilaian ke periode yang aktif."
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            await onCreateAspect(e);
            onCloseAdd();
          }}
        >
          <FormField
            id="aspect-name-modal"
            label="Nama Aspek"
            placeholder="Contoh: Kicking"
            value={aspectName}
            onChange={(e) => setAspectName(e.target.value)}
            required
          />
          <FormField
            id="aspect-category-modal"
            label="Kategori"
            placeholder="Contoh: Teknik"
            value={aspectCategory}
            onChange={(e) => setAspectCategory(e.target.value)}
          />
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
            disabled={isSaving || !selectedPeriodId}
            type="submit"
          >
            Tambah Variabel
          </button>
        </form>
      </SheetModal>

      {/* Modal Edit Variabel */}
      <SheetModal
        isOpen={Boolean(editingAspect)}
        onClose={onCloseEdit}
        title="Edit Variabel Penilaian"
        description="Perbarui nama atau kategori aspek penilaian."
      >
        {editingAspect ? (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await onUpdateAspect(editingAspect);
              onCloseEdit();
            }}
          >
            <FormField
              id="edit-aspect-name-modal"
              label="Nama Variabel"
              value={editingAspectName}
              onChange={(e) => setEditingAspectName(e.target.value)}
              required
            />
            <FormField
              id="edit-aspect-category-modal"
              label="Kategori"
              value={editingAspectCategory}
              onChange={(e) => setEditingAspectCategory(e.target.value)}
              placeholder="Tanpa kategori"
            />
            <div className="flex gap-2">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted"
                disabled={isSaving}
                type="submit"
              >
                Simpan Perubahan
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-primary hover:bg-surface-container"
                type="button"
                onClick={onCloseEdit}
              >
                Batal
              </button>
            </div>
          </form>
        ) : null}
      </SheetModal>
    </>
  );
}
