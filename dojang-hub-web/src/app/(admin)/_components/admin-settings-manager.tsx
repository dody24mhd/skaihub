"use client";

import { useEffect, useState } from "react";
import {
  SiteSettings,
  getAdminSettings,
  upsertAdminSetting,
} from "../_lib/admin-api";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const KNOWN_KEYS: { key: string; label: string; description: string; icon: string }[] = [
  {
    key: "whatsapp_number",
    label: "Nomor WhatsApp",
    description: "Nomor WA untuk semua tombol CTA di website. Format: 628xxxxxxxxxx",
    icon: "call",
  },
  {
    key: "hero_stats_count",
    label: "Jumlah Akademi (Hero)",
    description: "Angka yang tampil di hero section: \"Sudah dipercaya X akademi\"",
    icon: "sports_martial_arts",
  },
  {
    key: "hero_stats_label",
    label: "Label Hero Stats",
    description: "Teks setelah angka di hero, contoh: \"akademi aktif di Indonesia\"",
    icon: "format_quote",
  },
  {
    key: "site_email",
    label: "Email Kontak",
    description: "Email yang ditampilkan di footer atau halaman tentang",
    icon: "email",
  },
];

type EditingState = { key: string; value: string } | null;

export default function AdminSettingsManager() {
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<SiteSettings>({});
  const [editing, setEditing] = useState<EditingState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || "";
      setToken(savedToken);

      if (!savedToken) {
        setIsLoading(false);
        setError("Login admin dulu.");
        return;
      }

      getAdminSettings(savedToken)
        .then(setSettings)
        .catch((err: Error) => setError(err.message))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function startEdit(key: string) {
    setEditing({ key, value: settings[key] ?? "" });
    setMessage("");
    setError("");
  }

  async function handleSave() {
    if (!editing || !token) return;

    setIsSaving(true);
    setError("");

    try {
      await upsertAdminSetting(token, editing.key, editing.value);
      setSettings((prev) => ({ ...prev, [editing.key]: editing.value }));
      setMessage(`"${editing.key}" berhasil disimpan.`);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-md bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary">
          {error}
        </div>
      ) : null}

      <section className="card-soft rounded-lg bg-white">
        <div className="border-b border-border p-5">
          <p className="label-caps mb-1 text-secondary">Konfigurasi Website</p>
          <h2 className="text-xl font-bold text-primary">Pengaturan Utama</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-muted">Memuat pengaturan...</div>
        ) : (
          <div className="divide-y divide-border">
            {KNOWN_KEYS.map((item) => {
              const currentValue = settings[item.key];
              const isEditing = editing?.key === item.key;

              return (
                <div key={item.key} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon name={item.icon} className="text-[20px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-primary">{item.label}</p>
                          <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                        </div>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(item.key)}
                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
                          >
                            <Icon name="edit" className="text-[18px]" />
                            {currentValue ? "Edit" : "Isi"}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            autoFocus
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="h-10 flex-1 rounded-md border border-primary px-3 text-sm outline-none ring-2 ring-primary/10"
                            placeholder={`Masukkan ${item.label.toLowerCase()}`}
                          />
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-container disabled:opacity-50"
                          >
                            {isSaving ? "Menyimpan..." : "Simpan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-primary transition hover:bg-surface-container-low"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {currentValue ? (
                            <p className="rounded-md bg-surface-container-low px-3 py-2 font-mono text-sm text-primary">
                              {currentValue}
                            </p>
                          ) : (
                            <p className="text-sm italic text-muted">Belum diisi</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
