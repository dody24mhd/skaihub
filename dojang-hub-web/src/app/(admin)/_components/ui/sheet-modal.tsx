"use client";

import { ReactNode, useEffect, useRef } from "react";

export type SheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "bottom" | "left";
  children: ReactNode;
  className?: string;
};

export default function SheetModal({
  isOpen,
  onClose,
  title,
  description,
  side = "bottom",
  children,
  className = "",
}: SheetModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Simpan elemen pemicu fokus saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      // Kunci scroll body
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Berikan fokus ke dialog
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (triggerRef.current && typeof triggerRef.current.focus === "function") {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Tangani tombol keyboard: Escape & focus trap Tab
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLeft = side === "left";

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        isLeft
          ? "justify-start items-stretch"
          : "items-end justify-center md:items-center p-0 md:p-4"
      }`}
    >
      {/* Backdrop */}
      <div
        data-testid="sheet-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-primary/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-modal-title"
        aria-describedby={description ? "sheet-modal-desc" : undefined}
        tabIndex={-1}
        className={`relative z-10 flex flex-col bg-white text-primary border-border shadow-2xl focus:outline-hidden ${
          isLeft
            ? "h-full w-full max-w-xs sm:max-w-sm border-r overflow-y-auto"
            : "w-full max-w-lg max-h-[90dvh] overflow-y-auto border-t md:border"
        } ${className}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2
              id="sheet-modal-title"
              className="truncate font-heading text-lg font-bold uppercase tracking-tight text-primary"
            >
              {title}
            </h2>
            {description ? (
              <p id="sheet-modal-desc" className="text-xs text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="inline-flex size-11 shrink-0 items-center justify-center border border-border bg-white text-primary transition hover:bg-secondary/10 hover:text-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
