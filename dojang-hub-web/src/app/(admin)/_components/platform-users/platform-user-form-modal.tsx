"use client";

import { FormEvent, useState } from "react";
import { PlatformUser, PlatformUserPayload } from "../../_lib/admin-api";
import { FormField, SheetModal } from "../ui";

type PlatformUserFormModalProps = {
  isOpen: boolean;
  editing: PlatformUser | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: PlatformUserPayload) => Promise<void>;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  is_active: boolean;
};

function initialForm(editing: PlatformUser | null): FormState {
  return {
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    password: "",
    is_active: editing?.is_active ?? true,
  };
}

function toPayload(form: FormState): PlatformUserPayload {
  const payload: PlatformUserPayload = {
    name: form.name.trim(),
    email: form.email.trim(),
    is_active: form.is_active,
  };
  return form.password ? { ...payload, password: form.password } : payload;
}

function PlatformUserForm({ editing, isSaving, error, onClose, onSubmit }: Omit<PlatformUserFormModalProps, "isOpen">) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(toPayload(form));
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
          {error}
        </p>
      ) : null}
      <FormField
        id="platform-user-name"
        label="Nama Lengkap"
        required
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        placeholder="Contoh: Rina Kurniawati"
      />
      <FormField
        id="platform-user-email"
        label="Email Login"
        type="email"
        required
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        placeholder="nama@skaihub.com"
      />
      <FormField
        id="platform-user-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required={!editing}
        minLength={8}
        value={form.password}
        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
        hint={editing ? "Mengisi password baru akan mengeluarkan semua sesi login staf ini." : undefined}
      />

      <label className="flex items-center gap-3 text-sm font-semibold text-primary">
        <input
          type="checkbox"
          className="size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary/20"
          checked={form.is_active}
          onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
        />
        <span>Akun aktif</span>
      </label>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-surface-container-low focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          onClick={onClose}
          disabled={isSaving}
        >
          Batal
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
          disabled={isSaving}
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

export default function PlatformUserFormModal(props: PlatformUserFormModalProps) {
  const { isOpen, onClose, editing } = props;

  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Staf Platform" : "Tambah Staf Platform"}
      description={
        editing
          ? `Perbarui akun ${editing.name}.`
          : "Staf platform bisa mengelola CMS situs SKAIHUB, tanpa akses ke data akademi."
      }
    >
      {isOpen ? <PlatformUserForm key={editing ? editing.id : "new"} {...props} /> : null}
    </SheetModal>
  );
}
