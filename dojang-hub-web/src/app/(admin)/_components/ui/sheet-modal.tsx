"use client";

import { KeyboardEvent, ReactNode, useEffect, useId, useRef } from "react";
import Icon from "./icon";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Sheet bisa bertumpuk; kunci scroll body dihitung agar yang terakhir ditutup yang memulihkan.
let scrollLockCount = 0;
let overflowBeforeLock = "";

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    overflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = overflowBeforeLock;
  }
}

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
  const titleId = useId();
  const descriptionId = useId();

  // Simpan elemen pemicu fokus saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      lockBodyScroll();

      // Berikan fokus ke dialog
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        unlockBodyScroll();
        if (triggerRef.current && typeof triggerRef.current.focus === "function") {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Escape & focus trap ditangani di panel (bukan window) agar hanya sheet teratas yang bereaksi.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key !== "Tab" || !dialogRef.current) return;
    e.stopPropagation();

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

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
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
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
              id={titleId}
              className="truncate font-heading text-lg font-bold uppercase tracking-tight text-primary"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-xs text-muted">
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
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
