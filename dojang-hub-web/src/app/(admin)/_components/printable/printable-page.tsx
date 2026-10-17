"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "skaihub_admin_token";

export type PrintOrientation = "portrait" | "landscape";

// Saat dicetak hanya dokumen (.printable-doc) yang tampil, di kertas A4.
function printCss(orientation: PrintOrientation): string {
  return `
@page { size: A4 ${orientation}; margin: 10mm; }
@media print {
  body * { visibility: hidden; }
  .printable-doc, .printable-doc * { visibility: visible; }
  .printable-doc { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
  .printable-doc * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`;
}

type PrintableState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string;
  reload: () => Promise<void>;
};

export function usePrintableData<T>(load: ((token: string) => Promise<T>) | null, fallbackError: string): PrintableState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(load));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!load) return;
    const token = localStorage.getItem(TOKEN_KEY) || "";
    setIsLoading(true);
    setError("");
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }

    try {
      setData(await load(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallbackError);
    } finally {
      setIsLoading(false);
    }
  }, [load, fallbackError]);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload]);

  return { data, isLoading, error, reload };
}

type PrintablePageProps = {
  backHref: string;
  backLabel: string;
  orientation: PrintOrientation;
  widthClass: string;
  isReady: boolean;
  isLoading: boolean;
  loadingText: string;
  error: string;
  onRetry?: () => void;
  children: ReactNode;
};

export default function PrintablePage({
  backHref,
  backLabel,
  orientation,
  widthClass,
  isReady,
  isLoading,
  loadingText,
  error,
  onRetry,
  children,
}: PrintablePageProps) {
  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-primary print:bg-white print:p-0">
      <style>{printCss(orientation)}</style>
      <div className={`mx-auto space-y-4 ${widthClass}`}>
        <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary" href={backHref}>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            {backLabel}
          </Link>
          {isReady ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-sm font-bold text-white"
              onClick={() => window.print()}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">print</span>
              Cetak / Simpan PDF
            </button>
          ) : null}
        </div>

        {isLoading ? <p className="text-sm text-muted">{loadingText}</p> : null}

        {error ? (
          <div role="alert" className="flex flex-col gap-3 border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-secondary">{error}</p>
            {onRetry ? (
              <button className="min-h-11 border border-secondary/30 bg-white px-4 text-sm font-bold text-secondary" onClick={onRetry} type="button">
                Coba lagi
              </button>
            ) : null}
          </div>
        ) : null}

        {isReady && !isLoading ? children : null}
      </div>
    </main>
  );
}
