"use client";

import React, { ReactNode } from "react";

export type ResponsiveColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  primary?: boolean;
  hideOnMobile?: boolean;
  className?: string;
  headerClassName?: string;
};

export type ResponsiveListProps<T> = {
  columns: ResponsiveColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

export default function ResponsiveList<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyState,
  ariaLabel = "Daftar data",
  className = "",
}: ResponsiveListProps<T>) {
  if (rows.length === 0) {
    if (emptyState) return <>{emptyState}</>;

    return (
      <div className="border-2 border-dashed border-border bg-white p-8 text-center text-sm font-medium text-muted">
        Tidak ada data.
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) || columns[0];
  const secondaryCols = columns.filter((c) => c !== primaryCol && !c.hideOnMobile);

  return (
    <div className={`w-full ${className}`}>
      {/* Tampilan Desktop & Tablet (md+) -> Tabel */}
      <div className="hidden overflow-x-auto border border-border bg-white md:block">
        <table className="w-full text-left text-sm" aria-label={ariaLabel}>
          <thead className="border-b border-border bg-surface-container-low text-xs font-bold uppercase tracking-wider text-primary">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3.5 ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const key = getRowKey(row);
              const isClickable = Boolean(onRowClick);

              return (
                <tr
                  key={key}
                  onClick={isClickable ? () => onRowClick?.(row) : undefined}
                  className={`transition-colors ${
                    isClickable
                      ? "cursor-pointer hover:bg-surface-container-low/60"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 align-middle ${col.className || ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tampilan Mobile (<md) -> Daftar Kartu */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const key = getRowKey(row);
          const isClickable = Boolean(onRowClick);

          return (
            <div
              key={key}
              data-testid="responsive-list-card"
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={isClickable ? () => onRowClick?.(row) : undefined}
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick?.(row);
                      }
                    }
                  : undefined
              }
              className={`border-2 border-border bg-white p-4 transition ${
                isClickable
                  ? "min-h-[44px] cursor-pointer hover:border-primary/40 active:bg-surface-container-low"
                  : ""
              }`}
            >
              {/* Judul Kartu (Primary Column) */}
              <div className="border-b border-border/80 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {primaryCol.header}
                </span>
                <div className="font-heading text-base font-bold text-primary">
                  {primaryCol.render(row)}
                </div>
              </div>

              {/* Detail Pasangan Label - Nilai */}
              {secondaryCols.length > 0 ? (
                <div className="mt-3 space-y-2 text-sm">
                  {secondaryCols.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="shrink-0 text-xs font-semibold text-muted">
                        {col.header}
                      </span>
                      <div className="min-w-0 text-right font-medium text-primary">
                        {col.render(row)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
