"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Student,
  TrainingClass,
  deleteAkademiStudent,
  downloadAkademiStudentsExport,
  getAkademiClasses,
  getAkademiMe,
  getAkademiStudents,
} from "../_lib/admin-api";
import AcademyRankBeltBadge from "./academy-rank-belt-badge";

const TOKEN_KEY = "skaihub_admin_token";

const statusLabels: Record<Student["status"], string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  alumni: "Alumni",
};

const statusStyles: Record<Student["status"], string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-yellow-100 text-yellow-700",
  alumni: "bg-surface-container text-muted",
};

const PER_PAGE = 25;

export default function AcademyStudentsManager() {
  const tokenRef = useRef("");
  const [items, setItems] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Student["status"]>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const firstItemNumber = totalItems ? (currentPage - 1) * PER_PAGE + 1 : 0;
  const lastItemNumber = totalItems ? firstItemNumber + items.length - 1 : 0;

  const loadLookups = useCallback(async (activeToken: string) => {
    const [profileData, classData] = await Promise.all([
      getAkademiMe(activeToken),
      getAkademiClasses(activeToken),
    ]);

    setCanManage(["ketua_akademi", "admin_akademi"].includes(profileData.user.role));
    setClasses(classData.data);
  }, []);

  const loadStudents = useCallback(async (activeToken: string, targetPage = page) => {
    const studentData = await getAkademiStudents(activeToken, {
      search: debouncedQuery.trim(),
      status: statusFilter,
      class_id: classFilter,
      page: targetPage,
      per_page: PER_PAGE,
    });

    setItems(studentData.data.data);
    setCurrentPage(studentData.data.current_page);
    setLastPage(studentData.data.last_page);
    setTotalItems(studentData.data.total);
  }, [classFilter, debouncedQuery, page, statusFilter]);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: "all" | Student["status"]) {
    setStatusFilter(value);
    setPage(1);
  }

  function updateClass(value: string) {
    setClassFilter(value);
    setPage(1);
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

      loadLookups(activeToken)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat siswa."))
        .finally(() => setIsLoading(false));
    });
  }, [loadLookups]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!tokenRef.current || isLoading) return;

    setIsTableLoading(true);
    setError("");
    loadStudents(tokenRef.current)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat siswa."))
      .finally(() => setIsTableLoading(false));
  }, [classFilter, debouncedQuery, isLoading, loadStudents, page, statusFilter]);

  async function handleDelete(item: Student) {
    const confirmed = window.confirm(`Hapus siswa ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiStudent(tokenRef.current, item.id);
      await loadStudents(tokenRef.current, page);
      setMessage("Siswa dihapus.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus siswa.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await downloadAkademiStudentsExport(tokenRef.current, {
        search: debouncedQuery.trim(),
        status: statusFilter,
        class_id: classFilter,
      });
      setMessage("Export daftar siswa diproses.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal export siswa.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Memuat siswa...</p>;

  return (
    <div className="flex flex-col gap-6">
      <section className="card-soft order-2 rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-caps text-secondary">Master Data</p>
            <h2 className="font-heading text-xl font-bold text-primary">Siswa</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            <input className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" placeholder="Cari siswa" value={query} onChange={(event) => updateQuery(event.target.value)} />
            <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={statusFilter} onChange={(event) => updateStatus(event.target.value as "all" | Student["status"])}>
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="alumni">Alumni</option>
            </select>
            <select className="h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-primary" value={classFilter} onChange={(event) => updateClass(event.target.value)}>
              <option value="all">Semua kelas</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {canManage ? (
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-white transition hover:bg-primary-container"
                href="/academy/students/new"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah Siswa
              </Link>
            ) : null}
            {canManage ? <button className="h-10 rounded-md border border-border px-3 text-sm font-bold text-primary" onClick={handleExport} type="button" disabled={isSaving}>Export</button> : null}
          </div>
        </div>

        {message ? <p className="mt-4 rounded-md border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">{error}</p> : null}

        {isTableLoading ? <p className="mt-4 text-xs font-semibold text-muted">Memuat ulang daftar siswa...</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                <th className="pb-3">Foto</th>
                <th className="pb-3">Nama Siswa</th>
                <th className="pb-3">Kelas</th>
                <th className="pb-3">Tingkatan</th>
                <th className="pb-3">Fisik</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    {item.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photo_url} alt="" className="size-10 rounded-md object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-bold text-primary">
                    {item.name}
                    <span className="block text-xs font-medium text-muted">{item.member_number}</span>
                  </td>
                  <td className="py-3 text-muted">{item.primary_class?.name || "-"}</td>
                  <td className="py-3">
                    <div className="flex flex-col items-start gap-1">
                      <AcademyRankBeltBadge rank={item.current_rank} size="sm" showLabel={false} />
                      <span className="text-xs font-semibold text-muted">{item.current_rank?.label || "Belum ada tingkatan"}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted">{item.height_cm} cm / {Number(item.weight_kg)} kg</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyles[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" href={`/academy/students/${item.id}`}>Detail</Link>
                    {canManage ? <Link className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-bold text-primary" href={`/academy/students/${item.id}/edit`}>Edit</Link> : null}
                    {canManage ? <button className="rounded-md border border-secondary/30 px-3 py-1 text-xs font-bold text-secondary" onClick={() => handleDelete(item)} type="button">Hapus</button> : null}
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr><td className="py-8 text-sm text-muted" colSpan={7}>Belum ada siswa.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalItems
              ? `Menampilkan ${firstItemNumber}-${lastItemNumber} dari ${totalItems} siswa`
              : "Tidak ada siswa sesuai filter."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={currentPage <= 1 || isTableLoading}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="material-symbols-outlined text-[17px]">chevron_left</span>
              Prev
            </button>
            <span className="min-w-24 text-center text-xs font-bold text-primary">
              Halaman {currentPage} / {lastPage || 1}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, lastPage))}
              disabled={currentPage >= lastPage || isTableLoading}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <span className="material-symbols-outlined text-[17px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
