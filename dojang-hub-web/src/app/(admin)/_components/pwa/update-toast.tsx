"use client";

import { useEffect, useState } from "react";
import { handleApplyUpdate } from "@/lib/pwa/update-manager";

export default function UpdateToast() {
  const [waitingRegistration, setWaitingRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    function onUpdateAvailable(event: Event) {
      const customEvent = event as CustomEvent<ServiceWorkerRegistration>;
      if (customEvent.detail) {
        setWaitingRegistration(customEvent.detail);
      }
    }

    window.addEventListener("sw-update-available", onUpdateAvailable);
    return () => {
      window.removeEventListener("sw-update-available", onUpdateAvailable);
    };
  }, []);

  if (!waitingRegistration) {
    return null;
  }

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-primary p-4 text-white shadow-lg sm:left-auto sm:right-6 sm:bottom-6"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary text-[24px]">
          system_update
        </span>
        <div>
          <p className="text-sm font-semibold">Versi baru tersedia</p>
          <p className="text-xs text-white/70">Muat ulang untuk memperbarui aplikasi.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          handleApplyUpdate(waitingRegistration);
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 text-xs font-bold text-white transition hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-white"
      >
        Muat ulang
      </button>
    </aside>
  );
}
