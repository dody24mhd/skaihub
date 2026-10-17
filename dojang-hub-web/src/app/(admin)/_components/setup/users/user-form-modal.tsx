"use client";

import { FormEvent, useState } from "react";
import { AcademyManagedUser, AdminUser } from "../../../_lib/admin-api";
import { FormField, SheetModal } from "../../ui";

export type UserFormData = {
  name: string;
  email: string;
  password: string;
  role: "ketua_akademi" | "admin_akademi" | "pelatih";
  is_active: boolean;
  is_coach: boolean;
};

const emptyForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "pelatih",
  is_active: true,
  is_coach: true,
};

const roleLabels: Record<AdminUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin Internal",
  ketua_akademi: "Ketua Akademi",
  admin_akademi: "Pengurus Akademi",
  pelatih: "Pelatih",
};

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  editing: AcademyManagedUser | null;
  canManagePengurus: boolean;
  currentUserId: number | null;
  isSaving: boolean;
};

function getInitialForm(
  editing: AcademyManagedUser | null,
  canManagePengurus: boolean
): UserFormData {
  if (editing) {
    return {
      name: editing.name,
      email: editing.email,
      password: "",
      role:
        editing.role === "ketua_akademi"
          ? "ketua_akademi"
          : editing.role === "admin_akademi"
          ? "admin_akademi"
          : "pelatih",
      is_active: editing.is_active,
      is_coach: editing.role === "pelatih" || Boolean(editing.coach_profile),
    };
  }
  return {
    ...emptyForm,
    role: canManagePengurus ? "admin_akademi" : "pelatih",
    is_coach: !canManagePengurus,
  };
}

function UserFormContent({
  editing,
  canManagePengurus,
  currentUserId,
  isSaving,
  onClose,
  onSubmit,
}: Omit<UserFormModalProps, "isOpen">) {
  const [form, setForm] = useState<UserFormData>(() =>
    getInitialForm(editing, canManagePengurus)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField
        id="user-name"
        label="Nama Lengkap"
        required
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        placeholder="Contoh: Sabeum Hartono"
      />

      <FormField
        id="user-email"
        label="Email Login"
        type="email"
        required
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        placeholder="nama@email.com"
      />

      <FormField
        id="user-password"
        label="Password"
        type="password"
        required={!editing}
        value={form.password}
        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
        hint={
          editing
            ? "Isi password baru hanya jika ingin mereset password akun ini."
            : undefined
        }
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="user-role" className="text-xs font-bold uppercase tracking-wide text-primary">
          Jenis Akun
        </label>
        {canManagePengurus && form.role !== "ketua_akademi" ? (
          <select
            id="user-role"
            className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-base text-primary transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
            value={form.role}
            onChange={(event) => {
              const nextRole = event.target.value as UserFormData["role"];
              setForm((current) => ({
                ...current,
                role: nextRole,
                is_coach: nextRole === "pelatih" ? true : current.is_coach,
              }));
            }}
          >
            <option value="admin_akademi">Pengurus Akademi</option>
            <option value="pelatih">Pelatih</option>
          </select>
        ) : (
          <div className="flex min-h-11 items-center border border-border bg-surface-container px-3.5 text-sm font-medium text-muted">
            {roleLabels[form.role] || form.role}
          </div>
        )}
      </div>

      {form.role !== "pelatih" ? (
        <label className="flex items-start gap-3 border border-border bg-surface-container-low p-3 text-sm font-semibold text-primary">
          <input
            className="mt-1 size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary"
            type="checkbox"
            checked={form.is_coach}
            onChange={(event) =>
              setForm((current) => ({ ...current, is_coach: event.target.checked }))
            }
          />
          <span>
            Juga sebagai pelatih
            <span className="block text-xs font-medium leading-5 text-muted">
              Akun ini punya akses {roleLabels[form.role]}, sekaligus tercatat di daftar pelatih.
            </span>
          </span>
        </label>
      ) : null}

      <label className="flex items-center gap-3 text-sm font-semibold text-primary">
        <input
          type="checkbox"
          className="size-4 rounded-xs border-border text-primary focus:ring-2 focus:ring-primary"
          checked={form.is_active}
          disabled={editing?.id === currentUserId}
          onChange={(event) =>
            setForm((current) => ({ ...current, is_active: event.target.checked }))
          }
        />
        <span>Akun aktif</span>
      </label>
      {editing?.id === currentUserId ? (
        <p className="text-xs font-medium text-muted">
          Akun yang sedang digunakan login tidak bisa dinonaktifkan sendiri.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center border border-border bg-white px-5 text-sm font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
          onClick={onClose}
          disabled={isSaving}
        >
          Batal
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-container disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
          disabled={isSaving}
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

export default function UserFormModal(props: UserFormModalProps) {
  const { isOpen, onClose, editing } = props;

  return (
    <SheetModal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Akun" : "Tambah Akun"}
      description={
        editing
          ? `Perbarui akses akun untuk ${editing.name}`
          : "Tambahkan akun login baru untuk pengurus atau pelatih."
      }
    >
      {isOpen ? (
        <UserFormContent
          key={editing ? editing.id : "new"}
          {...props}
        />
      ) : null}
    </SheetModal>
  );
}
