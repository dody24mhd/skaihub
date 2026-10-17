"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { SppReceipt, getAkademiSppReceipt } from "../../_lib/admin-api";
import { money } from "../students/format";
import { paymentMethodLabel, receiptDateLabel, receiptPeriodLabel, receiptWhatsappUrl } from "./spp-receipt";
import Icon from "../ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

// Saat dicetak hanya kwitansi yang tampil; ukuran kertas (A5/A4) dipilih pengguna di dialog cetak.
const PRINT_CSS = `
@page { size: portrait; margin: 12mm; }
@media print {
  body * { visibility: hidden; }
  .spp-receipt, .spp-receipt * { visibility: visible; }
  .spp-receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; padding: 0; }
  .spp-receipt * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`;

function Row({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-right text-sm ${strong ? "font-heading text-lg font-black text-primary" : "font-semibold text-primary"}`}>{children}</dd>
    </div>
  );
}

function ReceiptDocument({ receipt }: { receipt: SppReceipt }) {
  const payer = receipt.student.guardian_name || receipt.student.name;

  return (
    <article aria-label={`Kwitansi SPP ${receipt.receipt_number || ""}`} className="spp-receipt border border-border bg-white p-5 sm:p-8">
      <header className="flex flex-col gap-3 border-b-4 border-primary pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-heading text-xl font-black text-primary">{receipt.akademi.name}</p>
          <p className="label-caps mt-1 text-secondary">Kwitansi Pembayaran SPP</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold uppercase text-muted">No. Kwitansi</p>
          <p className="font-heading text-base font-black text-primary">{receipt.receipt_number || "-"}</p>
          <p className="text-xs text-muted">{receiptDateLabel(receipt.paid_at)}</p>
        </div>
      </header>

      <dl className="mt-4">
        <Row label="Telah terima dari">{payer}</Row>
        <Row label="Siswa">
          {receipt.student.name}
          {receipt.student.member_number ? <span className="block text-xs font-normal text-muted">{receipt.student.member_number}</span> : null}
        </Row>
        <Row label="Kelas">{receipt.class_name || "-"}</Row>
        <Row label="Untuk pembayaran">SPP {receiptPeriodLabel(receipt.billing_year, receipt.billing_month)}</Row>
        <Row label="Metode">{paymentMethodLabel(receipt.method)}</Row>
        <Row label="Jumlah dibayar" strong>{money(receipt.amount)}</Row>
        <Row label="Total tagihan">{money(receipt.bill_amount)}</Row>
        <Row label="Sisa tagihan">{money(receipt.remaining_amount)}</Row>
        {receipt.notes ? <Row label="Catatan">{receipt.notes}</Row> : null}
      </dl>

      <footer className="mt-8 flex justify-end">
        <div className="w-48 text-center">
          <p className="text-xs text-muted">Diterima oleh</p>
          <div className="mt-12 border-t border-primary pt-1 text-sm font-bold text-primary">{receipt.received_by || "-"}</div>
        </div>
      </footer>
    </article>
  );
}

export default function SppReceiptView({ paymentId }: { paymentId: number }) {
  const [receipt, setReceipt] = useState<SppReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    setIsLoading(true);
    setError("");
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await getAkademiSppReceipt(token, paymentId);
      setReceipt(result.receipt);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat kwitansi.");
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const whatsappUrl = receipt ? receiptWhatsappUrl(receipt) : null;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-primary print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary" href="/academy/spp">
            <Icon name="arrow_back" className="text-[18px]" />
            Kembali ke SPP
          </Link>
          {receipt ? (
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-sm font-bold text-white" onClick={() => window.print()} type="button">
                <Icon name="print" className="text-[18px]" />
                Cetak / PDF
              </button>
              {whatsappUrl ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 bg-success-strong px-4 text-sm font-bold text-white" href={whatsappUrl} rel="noreferrer" target="_blank">
                  <Icon name="share" className="text-[18px]" />
                  Bagikan via WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {receipt && !whatsappUrl ? (
          <p className="text-xs text-muted print:hidden">Nomor wali belum diisi, kwitansi tidak bisa dibagikan via WhatsApp.</p>
        ) : null}

        {isLoading ? <p className="text-sm text-muted">Memuat kwitansi...</p> : null}

        {error ? (
          <div role="alert" className="flex flex-col gap-3 border border-secondary/20 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-secondary">{error}</p>
            <button className="min-h-11 border border-secondary/30 bg-white px-4 text-sm font-bold text-secondary" onClick={() => void load()} type="button">
              Coba lagi
            </button>
          </div>
        ) : null}

        {receipt && !isLoading ? <ReceiptDocument receipt={receipt} /> : null}
      </div>
    </main>
  );
}
