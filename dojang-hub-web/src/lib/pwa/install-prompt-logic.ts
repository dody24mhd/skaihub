export interface ShouldShowInstallPromptParams {
  isStandalone: boolean;
  dismissedAt: number | null;
  currentTime: number;
  dismissDurationMs?: number;
  hasPromptEvent: boolean;
  isIOS: boolean;
}

export const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari dalam ms
export const INSTALL_PROMPT_DISMISS_KEY = "skaihub_pwa_install_dismissed_at";

export function shouldShowInstallPrompt({
  isStandalone,
  dismissedAt,
  currentTime,
  dismissDurationMs = DISMISS_DURATION_MS,
  hasPromptEvent,
  isIOS,
}: ShouldShowInstallPromptParams): boolean {
  // 1. Sembunyikan bila running di display-mode: standalone
  if (isStandalone) {
    return false;
  }

  // 2. Sembunyikan bila ditutup dalam 30 hari terakhir
  if (dismissedAt !== null && !isNaN(dismissedAt)) {
    if (currentTime - dismissedAt < dismissDurationMs) {
      return false;
    }
  }

  // 3. Tampilkan bila ada prompt event (Chromium/Android) atau di iOS
  return hasPromptEvent || isIOS;
}

export function getDismissedAt(
  storage?: { getItem(key: string): string | null } | null
): number | null {
  try {
    const s = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    if (!s) return null;
    const value = s.getItem(INSTALL_PROMPT_DISMISS_KEY);
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function setDismissedAt(
  time: number = Date.now(),
  storage?: { setItem(key: string, value: string): void } | null
): void {
  try {
    const s = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    if (!s) return;
    s.setItem(INSTALL_PROMPT_DISMISS_KEY, time.toString());
  } catch {
    // Abaikan jika localStorage diblokir / private browsing
  }
}

export function checkIsIOS(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}
