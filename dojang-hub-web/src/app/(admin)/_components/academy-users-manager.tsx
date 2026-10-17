"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AcademyManagedUser,
  AdminUser,
  createAkademiUser,
  deleteAkademiUser,
  getAkademiMe,
  getAkademiUsers,
  updateAkademiUser,
} from "../_lib/admin-api";
import UserFormModal, { UserFormData } from "./setup/users/user-form-modal";
import { PageHeader, ResponsiveColumn, ResponsiveList } from "./ui";
import Icon from "./ui/icon";
import StatusMessage from "./ui/status-message";

const TOKEN_KEY = "skaihub_admin_token";

const roleLabels: Record<AdminUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin Internal",
  ketua_akademi: "Ketua Akademi",
  admin_akademi: "Pengurus Akademi",
  pelatih: "Pelatih",
};

export default function AcademyUsersManager() {
  const tokenRef = useRef("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentRole, setCurrentRole] = useState<AdminUser["role"] | "">("");
  const [items, setItems] = useState<AcademyManagedUser[]>([]);
  const [editing, setEditing] = useState<AcademyManagedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManagePengurus = ["ketua_akademi", "admin_akademi"].includes(currentRole);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.name, item.email]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(keyword));
      const matchesRole =
        roleFilter === "all" ||
        item.role === roleFilter ||
        (roleFilter === "pelatih" && Boolean(item.coach_profile));
      return matchesKeyword && matchesRole;
    });
  }, [items, query, roleFilter]);

  async function loadData(activeToken: string) {
    const [profileData, userData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiUsers(activeToken),
    ]);

    setCurrentRole(profileData.user.role);
    setCurrentUserId(profileData.user.id);
    setItems(userData.data);
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
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat akun akademi."))
        .finally(() => setIsLoading(false));
    });
  }, []);

  function closeModal() {
    setEditing(null);
    setIsModalOpen(false);
  }

  function openCreateModal() {
    setEditing(null);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function startEdit(item: AcademyManagedUser) {
    setEditing(item);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(formData: UserFormData) {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        is_active: formData.is_active,
        is_coach: formData.role === "pelatih" ? true : formData.is_coach,
      };

      if (editing) {
        await updateAkademiUser(tokenRef.current, editing.id, {
          ...payload,
          password: payload.password || undefined,
        });
      } else {
        await createAkademiUser(tokenRef.current, payload);
      }

      await loadData(tokenRef.current);
      closeModal();
      setMessage(editing ? "Akun diperbarui." : "Akun ditambahkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan akun.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(item: AcademyManagedUser) {
    if (item.id === currentUserId) {
      setError("Akun sendiri tidak bisa dinonaktifkan.");
      return;
    }

    const confirmed = window.confirm(`Nonaktifkan akun ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiUser(tokenRef.current, item.id);
      await loadData(tokenRef.current);
      if (editing?.id === item.id) closeModal();
      setMessage("Akun dinonaktifkan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menonaktifkan akun.");
    } finally {
      setIsSaving(false);
    }
  }

  const columns: ResponsiveColumn<AcademyManagedUser>[] = [
    {
      key: "name",
      header: "Akun",
      primary: true,
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{item.name}</span>
            {item.id === currentUserId ? (
              <span className="bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Akun saya
              </span>
            ) : null}
          </div>
          <span className="block text-xs font-medium text-muted">{item.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Jenis Akun",
      render: (item) => (
        <div>
          <span className="font-medium text-primary">{roleLabels[item.role] || item.role}</span>
          {item.coach_profile ? (
            <span className="mt-0.5 block text-xs font-bold text-secondary">Juga pelatih</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
            item.is_active ? "bg-success/10 text-success-strong" : "bg-secondary/10 text-secondary"
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
      render: (item: AcademyManagedUser) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startEdit(item)}
            className="inline-flex min-h-11 items-center justify-center border border-border px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            Edit
          </button>
          {item.is_active && item.id !== currentUserId ? (
            <button
              type="button"
              onClick={() => handleDeactivate(item)}
              className="inline-flex min-h-11 items-center justify-center border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/10 focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              Nonaktifkan
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  if (isLoading) return <p className="text-sm text-muted">Memuat akun akademi...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akses Akademi"
        title="Akun Operasional"
        description="Kelola akun login untuk pengurus dan pelatih yang berhak mengakses sistem akademi."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-xs transition hover:bg-secondary-dark focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
          >
            <Icon name="person_add" className="text-[20px]" />
            Tambah Akun
          </button>
        }
      />

      <StatusMessage tone="success" message={message} />
      <StatusMessage tone="error" message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <label htmlFor="users-search" className="sr-only">
              Cari akun
            </label>
            <input
              id="users-search"
              className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/80 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
              placeholder="Cari nama atau email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <label htmlFor="users-role-filter" className="sr-only">
              Filter role
            </label>
            <select
              id="users-role-filter"
              className="min-h-11 w-full border border-border-strong bg-white px-3.5 py-2.5 text-sm text-primary transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Semua role</option>
              {canManagePengurus ? <option value="admin_akademi">Pengurus Akademi</option> : null}
              <option value="pelatih">Pelatih</option>
            </select>
          </div>
        </div>
      </div>

      <ResponsiveList
        columns={columns}
        rows={filteredItems}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar akun operasional akademi"
        emptyState={
          <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
            {query || roleFilter !== "all"
              ? "Tidak ada akun yang sesuai dengan filter."
              : "Belum ada akun yang bisa dikelola."}
          </div>
        }
      />

      <UserFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editing={editing}
        canManagePengurus={canManagePengurus}
        currentUserId={currentUserId}
        isSaving={isSaving}
      />
    </div>
  );
}
