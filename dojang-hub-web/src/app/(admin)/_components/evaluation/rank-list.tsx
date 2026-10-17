"use client";

import { SportRank } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { ResponsiveColumn, ResponsiveList } from "../ui";
import Icon from "../ui/icon";

type RankListProps = {
  rows: SportRank[];
  builtinLabel: string;
  onEdit: (item: SportRank) => void;
  onDelete: (item: SportRank) => void;
};

export function isBuiltinRank(item: SportRank): boolean {
  return item.akademi_id === null || item.akademi_id === undefined;
}

export default function RankList({ rows, builtinLabel, onEdit, onDelete }: RankListProps) {
  const columns: ResponsiveColumn<SportRank>[] = [
    {
      key: "label",
      header: "Tingkatan",
      primary: true,
      render: (item) => (
        <div className="flex flex-wrap items-center gap-3">
          <AcademyRankBeltBadge rank={item} size="md" />
          <span className="text-xs font-semibold text-muted md:hidden">Urutan {item.sequence}</span>
        </div>
      ),
    },
    {
      key: "sequence",
      header: "Urutan",
      render: (item) => <span className="font-bold text-primary">{item.sequence}</span>,
    },
    {
      key: "source",
      header: "Asal",
      render: (item) =>
        isBuiltinRank(item) ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-surface-container px-2 py-0.5 text-xs font-bold text-muted">
            <Icon name="lock" className="text-[14px]" />
            {builtinLabel}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-sm bg-primary/5 px-2 py-0.5 text-xs font-bold text-primary">
            Tambahan akademi
          </span>
        ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item) =>
        isBuiltinRank(item) ? (
          <span className="text-xs text-muted">Terkunci</span>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container"
              onClick={() => onEdit(item)}
              type="button"
              aria-label={`Edit ${item.label}`}
            >
              Edit
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
              onClick={() => onDelete(item)}
              type="button"
              aria-label={`Hapus ${item.label}`}
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
