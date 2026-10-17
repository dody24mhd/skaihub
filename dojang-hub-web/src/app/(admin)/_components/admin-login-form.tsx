"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "../_lib/admin-api";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";
const EMAIL_KEY = "skaihub_admin_email";
const NAME_KEY = "skaihub_admin_name";
const ROLE_KEY = "skaihub_admin_role";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 4 && password.trim().length >= 6,
    [email, password],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setError("Isi email dan password admin terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await loginAdmin(email.trim(), password);

      localStorage.setItem(EMAIL_KEY, result.user.email);
      localStorage.setItem(NAME_KEY, result.user.name);
      localStorage.setItem(ROLE_KEY, result.user.role);
      localStorage.setItem(TOKEN_KEY, result.token);

      if (["ketua_akademi", "admin_akademi", "pelatih"].includes(result.user.role)) {
        router.push("/academy");
        return;
      }

      router.push("/internal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login admin gagal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-primary">
          Email admin
        </label>
        <div className="relative">
          <Icon name="alternate_email" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-muted" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            className="h-12 w-full rounded-md border border-border-strong bg-white px-12 text-sm text-primary outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary"
            placeholder="admin@skaihub.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-primary">
          Password
        </label>
        <div className="relative">
          <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-muted" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="h-12 w-full rounded-md border border-border-strong bg-white px-12 pr-14 text-sm text-primary outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary"
            placeholder="Masukkan password admin"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-surface-container-low hover:text-primary"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm font-medium text-secondary">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(3,22,54,0.18)] transition hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none"
        disabled={!canSubmit || isSubmitting}
      >
        <Icon name="login" className="text-[20px]" />
        {isSubmitting ? "Memeriksa akses..." : "Masuk ke Admin"}
      </button>
    </form>
  );
}
