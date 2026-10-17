"use client";

import { SportRank } from "../../_lib/admin-api";
import { ResponsiveColumn, ResponsiveList } from "../ui";
import { BeltIcon } from "./rank-form";

type RankListProps = {
  rows: SportRank[];
  onEdit: (item: SportRank) => void;
  onDelete: (item: SportRank) => void;
};

export default function RankList({ rows, onEdit, onDelete }: RankListProps) {
  const columns: ResponsiveColumn<SportRank>[] = [
    {
      key: "label",
      header: "Nama Tingkatan",
      primary: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <BeltIcon code={item.code} label={item.label} />
          <span className="text-xs font-semibold text-muted md:hidden">
            (Urutan: {item.sequence})
          </span>
        </div>
      ),
    },
    {
      key: "sequence",
      header: "Urutan",
      render: (item) => (
        <span className="font-bold text-primary">{item.sequence}</span>
      ),
    },
    {
      key: "code",
      header: "Kode",
      render: (item) => (
        <span className="rounded-sm bg-surface-container px-2 py-0.5 text-xs font-mono text-muted">
          {item.code}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container"
            onClick={() => onEdit(item)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
            onClick={() => onDelete(item)}
            type="button"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <ResponsiveList
      columns={columns}
      rows={rows}
      getRowKey={(item) => item.id}
      ariaLabel="Daftar Sabuk dan Tingkatan"
      emptyState={
        <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
          Belum ada tingkatan.
        </div>
      }
    />
  );
}
