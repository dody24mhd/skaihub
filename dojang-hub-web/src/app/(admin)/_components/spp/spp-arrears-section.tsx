"use client";

import { useCallback, useEffect, useState } from "react";
import { SppArrear, getAkademiSppArrears } from "../../_lib/admin-api";
import { money, shortDate } from "../students/format";
import { ResponsiveColumn, ResponsiveList } from "../ui";

const columns: ResponsiveColumn<SppArrear>[] = [
  {
    key: "student",
    header: "Siswa",
    primary: true,
    render: (row) => (
      <span className="break-words font-bold text-primary">
        {row.student.name}
        <span className="block text-xs font-normal text-muted">{row.student.member_number}</span>
      </span>
    ),
  },
  { key: "class", header: "Kelas", render: (row) => <span className="text-muted">{row.student.primary_class?.name || "-"}</span> },
  { key: "months", header: "Tunggakan", render: (row) => <span className="font-bold text-secondary">{row.months_count} bulan</span> },
  { key: "total", header: "Total sisa", render: (row) => <span className="font-bold text-primary">{money(row.total_remaining)}</span> },
  { key: "oldest", header: "Jatuh tempo terlama", render: (row) => <span className="text-muted">{shortDate(row.oldest_due_date)}</span> },
  { key: "guardian", header: "Wali", hideOnMobile: true, render: (row) => <span className="text-muted">{row.student.guardian_name || "-"}</span> },
];

export default function SppArrearsSection({ token }: { token: string }) {
  const [rows, setRows] = useState<SppArrear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getAkademiSppArrears(token);
      setRows(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat tunggakan.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (isLoading) return <p className="mt-5 text-sm text-muted">Memuat tunggakan...</p>;

  if (error) {
    return (
      <div role="alert" className="mt-5 flex flex-col gap-3 border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-secondary">{error}</p>
        <button className="min-h-11 border border-secondary/30 bg-white px-4 text-sm font-bold text-secondary" onClick={() => void load()} type="button">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-muted">Tagihan belum lunas yang sudah lewat jatuh tempo, dijumlahkan per siswa.</p>
      <ResponsiveList
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.student.id}
        ariaLabel="Tunggakan SPP per siswa"
        emptyState={<p className="border-2 border-dashed border-border p-8 text-center text-sm text-muted">Tidak ada tunggakan. Semua tagihan yang jatuh tempo sudah beres.</p>}
      />
    </div>
  );
}
