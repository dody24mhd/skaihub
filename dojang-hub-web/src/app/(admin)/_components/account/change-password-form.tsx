"use client";

import { FormEvent, useState } from "react";
import { changeOwnPassword, ChangePasswordPayload } from "../../_lib/admin-api";
import { FormField } from "../ui";

const TOKEN_KEY = "skaihub_admin_token";
const MIN_PASSWORD_LENGTH = 8;

const emptyForm: ChangePasswordPayload = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

function validate(form: ChangePasswordPayload): string {
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (form.password !== form.password_confirmation) {
    return "Konfirmasi password baru tidak cocok.";
  }
  if (form.password === form.current_password) {
    return "Password baru harus berbeda dari password saat ini.";
  }
  return "";
}

export default function ChangePasswordForm() {
  const [form, setForm] = useState<ChangePasswordPayload>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof ChangePasswordPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY) || "";
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await changeOwnPassword(token, form);
      setForm(emptyForm);
      setMessage("Password berhasil diubah. Sesi di perangkat lain sudah dikeluarkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengubah password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="max-w-lg space-y-4 border border-border bg-white p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
      {message ? (
        <p role="status" className="border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
          {error}
        </p>
      ) : null}

      <FormField
        id="current-password"
        label="Password Saat Ini"
        type="password"
        autoComplete="current-password"
        required
        value={form.current_password}
        onChange={(event) => update("current_password", event.target.value)}
      />
      <FormField
        id="new-password"
        label="Password Baru"
        type="password"
        autoComplete="new-password"
        required
        hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}
        value={form.password}
        onChange={(event) => update("password", event.target.value)}
      />
      <FormField
        id="new-password-confirmation"
        label="Ulangi Password Baru"
        type="password"
        autoComplete="new-password"
        required
        value={form.password_confirmation}
        onChange={(event) => update("password_confirmation", event.target.value)}
      />

      <p className="text-xs leading-5 text-muted">
        Setelah password diganti, semua sesi login di perangkat lain akan dikeluarkan. Sesi di perangkat ini tetap aktif.
      </p>

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex min-h-11 w-full items-center justify-center bg-primary px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-primary-container focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:bg-muted sm:w-auto"
      >
        {isSaving ? "Menyimpan..." : "Simpan Password"}
      </button>
    </form>
  );
}
