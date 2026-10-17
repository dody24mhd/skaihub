"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  checkIsIOS,
  getDismissedAt,
  setDismissedAt,
  shouldShowInstallPrompt,
} from "@/lib/pwa/install-prompt-logic";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const emptySubscribe = () => () => {};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const isEligible = useSyncExternalStore(
    emptySubscribe,
    () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      const dismissedAt = getDismissedAt();
      const isIOS = checkIsIOS(navigator.userAgent);

      return shouldShowInstallPrompt({
        isStandalone,
        dismissedAt,
        currentTime: Date.now(),
        hasPromptEvent: Boolean(deferredPrompt),
        isIOS,
      });
    },
    () => false
  );

  const isIOS = useSyncExternalStore(
    emptySubscribe,
    () => checkIsIOS(navigator.userAgent),
    () => false
  );

  if (manuallyDismissed || !isEligible) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedAt();
    setManuallyDismissed(true);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setManuallyDismissed(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <aside
      aria-label="Prompt instalasi aplikasi"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-6 md:max-w-md md:rounded-lg md:border md:pb-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            <span className="material-symbols-outlined text-[20px]">
              add_to_home_screen
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary">
              Pasang SKAIHUB Akademi
            </p>
            <p className="text-xs text-muted">
              {isIOS
                ? "Bagikan lalu Tambah ke Layar Utama"
                : "Akses cepat & pengalaman seperti aplikasi asli"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-3 text-xs font-semibold text-white transition hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1"
            >
              Pasang aplikasi
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup saran instalasi"
            className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:bg-surface-container hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {isIOS && (
        <div className="mt-2 flex items-center gap-2 rounded bg-surface-container-low px-3 py-2 text-xs text-primary">
          <span>Bagikan</span>
          <span className="material-symbols-outlined text-[16px]">ios_share</span>
          <span>&rarr;</span>
          <span className="font-semibold">Tambah ke Layar Utama</span>
          <span className="material-symbols-outlined text-[16px]">add_box</span>
        </div>
      )}
    </aside>
  );
}
