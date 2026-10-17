"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Student,
  TrainingClass,
  deleteAkademiStudent,
  downloadAkademiStudentsExport,
  getAkademiClasses,
  getAkademiMe,
  getAkademiStudents,
} from "../_lib/admin-api";
import ListPagination from "./students/list-pagination";
import { buildStudentColumns } from "./students/student-columns";
import StudentListToolbar, { StudentStatusFilter } from "./students/student-list-toolbar";
import { PageHeader, ResponsiveList } from "./ui";
import { useCanWrite } from "./ui/subscription-status";

const TOKEN_KEY = "skaihub_admin_token";

const PER_PAGE = 25;

export default function AcademyStudentsManager() {
  const [token, setToken] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [canManage, setCanManage] = useState(false);
  const canWrite = useCanWrite();
  const canEdit = canManage && canWrite;
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

  function updateStatus(value: StudentStatusFilter) {
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
      setToken(activeToken);

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
    if (!token || isLoading) return;

    queueMicrotask(() => {
      setIsTableLoading(true);
      setError("");
      loadStudents(token)
        .catch((caught) => setError(caught instanceof Error ? caught.message : "Gagal memuat siswa."))
        .finally(() => setIsTableLoading(false));
    });
  }, [classFilter, debouncedQuery, isLoading, loadStudents, page, reloadKey, statusFilter, token]);

  async function handleDelete(item: Student) {
    const confirmed = window.confirm(`Hapus siswa ${item.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAkademiStudent(token, item.id);
      await loadStudents(token, page);
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
      await downloadAkademiStudentsExport(token, {
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

  const columns = buildStudentColumns({ canManage: canEdit, onDelete: handleDelete });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Master Data"
        title="Siswa"
        className="mb-0"
        action={canEdit ? (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-container"
              href="/academy/students/new"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Siswa
            </Link>
            <button className="min-h-11 border border-border bg-white px-4 text-sm font-bold text-primary" onClick={handleExport} type="button" disabled={isSaving}>Export</button>
          </div>
        ) : undefined}
      />

      <StudentListToolbar
        query={query}
        statusFilter={statusFilter}
        classFilter={classFilter}
        classes={classes}
        onQueryChange={updateQuery}
        onStatusChange={updateStatus}
        onClassChange={updateClass}
      />

      {message ? <p className="border border-success/20 bg-success/5 p-3 text-sm font-semibold text-success">{message}</p> : null}
      {error ? (
        <div className="flex flex-col gap-2 border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          {token ? (
            <button className="min-h-11 border border-secondary/30 bg-white px-4 text-xs font-bold" onClick={() => setReloadKey((current) => current + 1)} type="button">Coba lagi</button>
          ) : null}
        </div>
      ) : null}

      {isTableLoading ? <p className="text-xs font-semibold text-muted">Memuat ulang daftar siswa...</p> : null}

      <ResponsiveList
        columns={columns}
        rows={items}
        getRowKey={(item) => item.id}
        ariaLabel="Daftar siswa"
        emptyState={<p className="border-2 border-dashed border-border bg-white p-8 text-center text-sm text-muted">Belum ada siswa.</p>}
      />

      <ListPagination
        summary={totalItems ? `Menampilkan ${firstItemNumber}-${lastItemNumber} dari ${totalItems} siswa` : "Tidak ada siswa sesuai filter."}
        currentPage={currentPage}
        lastPage={lastPage}
        isDisabled={isTableLoading}
        onPrev={() => setPage((current) => Math.max(current - 1, 1))}
        onNext={() => setPage((current) => Math.min(current + 1, lastPage))}
      />
    </div>
  );
}
