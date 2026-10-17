"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPlatformUser,
  deactivatePlatformUser,
  getAdminMe,
  getPlatformUsers,
  PlatformUser,
  PlatformUserPayload,
  updatePlatformUser,
} from "../../_lib/admin-api";
import { PageHeader, ResponsiveColumn, ResponsiveList } from "../ui";
import PlatformUserFormModal from "./platform-user-form-modal";
import Icon from "../ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const roleLabels: Record<PlatformUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Staf Platform",
};

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

export default function PlatformUsersManager() {
  const tokenRef = useRef("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [items, setItems] = useState<PlatformUser[]>([]);
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [me, users] = await Promise.all([
      getAdminMe(tokenRef.current),
      getPlatformUsers(tokenRef.current),
    ]);
    setCurrentUserId(me.user.id);
    setItems(users.data);
  }, []);

  const initialLoad = useCallback(() => {
    setIsLoading(true);
    setLoadError("");

    if (!tokenRef.current) {
      setLoadError("Sesi tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }

    loadData()
      .catch((caught) => setLoadError(errorMessage(caught, "Gagal memuat staf platform.")))
      .finally(() => setIsLoading(false));
  }, [loadData]);

  useEffect(() => {
    queueMicrotask(() => {
      tokenRef.current = localStorage.getItem(TOKEN_KEY) || "";
      initialLoad();
    });
  }, [initialLoad]);

  function openModal(item: PlatformUser | null) {
    setEditing(item);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditing(null);
    setError("");
    setIsModalOpen(false);
  }

  async function handleSubmit(payload: PlatformUserPayload) {
    setIsSaving(true);
    setError("");

    try {
      if (editing) {
        await updatePlatformUser(tokenRef.current, editing.id, payload);
      } else {
        await createPlatformUser(tokenRef.current, payload);
      }
      await loadData();
      closeModal();
      setMessage(editing ? "Staf platform diperbarui." : "Staf platform ditambahkan.");
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menyimpan staf platform."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(item: PlatformUser) {
    if (!window.confirm(`Nonaktifkan akun ${item.name}? Semua sesi login akun ini akan dikeluarkan.`)) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deactivatePlatformUser(tokenRef.current, item.id);
      await loadData();
      setMessage("Staf platform dinonaktifkan.");
    } catch (caught) {
      setError(errorMessage(caught, "Gagal menonaktifkan staf platform."));
    } finally {
      setIsSaving(false);
    }
  }

  const isManageable = (item: PlatformUser) => item.role === "admin" && item.id !== currentUserId;

  const columns: ResponsiveColumn<PlatformUser>[] = [
    {
      key: "name",
      header: "Akun",
      primary: true,
      render: (item) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-primary">{item.name}</span>
            {item.id === currentUserId ? (
              <span className="bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Akun saya
              </span>
            ) : null}
          </div>
          <span className="block break-all text-xs font-medium text-muted">{item.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Peran",
      render: (item) => <span className="font-medium text-primary">{roleLabels[item.role]}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
            item.is_active ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"
          }`}
        >
          {item.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      headerClassName: "text-right",
      className: "text-right",
      render: (item) =>
        isManageable(item) ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => openModal(item)}
              disabled={isSaving}
              aria-label={`Edit ${item.name}`}
              className="inline-flex min-h-11 items-center justify-center border border-border px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-surface-container-low focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              Edit
            </button>
            {item.is_active ? (
              <button
                type="button"
                onClick={() => handleDeactivate(item)}
                disabled={isSaving}
                aria-label={`Nonaktifkan ${item.name}`}
                className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary/20"
              >
                Nonaktifkan
              </button>
            ) : null}
          </div>
        ) : (
          <span className="text-xs font-medium text-muted">Tidak dapat diubah</span>
        ),
    },
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat staf platform...</p>;

  if (loadError) {
    return (
      <div className="space-y-3 border border-secondary/20 bg-secondary/5 p-4">
        <p role="alert" className="text-sm font-semibold text-secondary">{loadError}</p>
        <button
          type="button"
          onClick={initialLoad}
          className="inline-flex min-h-11 items-center justify-center border border-secondary px-4 text-sm font-bold text-secondary transition hover:bg-secondary hover:text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akses Platform"
        title="Staf Platform"
        description="Kelola akun staf internal SKAIHUB. Staf platform hanya mengelola CMS situs, tanpa akses ke data akademi."
        action={
          <button
            type="button"
            onClick={() => openModal(null)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary/50 sm:w-auto"
          >
            <Icon name="person_add" className="text-[20px]" />
            Tambah Staf
          </button>
        }
      />

      {message ? (
        <p role="status" className="border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">
          {message}
        </p>
      ) : null}
      {error && !isModalOpen ? (
        <p role="alert" className="border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
          {error}
        </p>
      ) : null}

      <ResponsiveList
        columns={columns}
        rows={items}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar staf platform"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            Belum ada staf platform.
          </div>
        }
      />

      <PlatformUserFormModal
        isOpen={isModalOpen}
        editing={editing}
        isSaving={isSaving}
        error={isModalOpen ? error : ""}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
