import { describe, expect, it } from "vitest";
import {
  checkIsIOS,
  DISMISS_DURATION_MS,
  getDismissedAt,
  setDismissedAt,
  shouldShowInstallPrompt,
} from "../install-prompt-logic";

describe("PWA Install Prompt Logic", () => {
  const baseTime = 1700000000000;

  describe("shouldShowInstallPrompt", () => {
    it("returns false if already in standalone mode", () => {
      expect(
        shouldShowInstallPrompt({
          isStandalone: true,
          dismissedAt: null,
          currentTime: baseTime,
          hasPromptEvent: true,
          isIOS: false,
        })
      ).toBe(false);
    });

    it("returns false if dismissed less than 30 days ago", () => {
      const dismissedRecently = baseTime - 1000 * 60 * 60 * 24 * 5; // 5 days ago
      expect(
        shouldShowInstallPrompt({
          isStandalone: false,
          dismissedAt: dismissedRecently,
          currentTime: baseTime,
          hasPromptEvent: true,
          isIOS: false,
        })
      ).toBe(false);
    });

    it("returns true if dismissed more than 30 days ago and prompt event is ready", () => {
      const dismissedLongAgo = baseTime - (DISMISS_DURATION_MS + 1000);
      expect(
        shouldShowInstallPrompt({
          isStandalone: false,
          dismissedAt: dismissedLongAgo,
          currentTime: baseTime,
          hasPromptEvent: true,
          isIOS: false,
        })
      ).toBe(true);
    });

    it("returns true for Android/Chromium when hasPromptEvent is true and not standalone", () => {
      expect(
        shouldShowInstallPrompt({
          isStandalone: false,
          dismissedAt: null,
          currentTime: baseTime,
          hasPromptEvent: true,
          isIOS: false,
        })
      ).toBe(true);
    });

    it("returns true for iOS Safari when not standalone and not dismissed", () => {
      expect(
        shouldShowInstallPrompt({
          isStandalone: false,
          dismissedAt: null,
          currentTime: baseTime,
          hasPromptEvent: false,
          isIOS: true,
        })
      ).toBe(true);
    });

    it("returns false when neither prompt event nor iOS is present", () => {
      expect(
        shouldShowInstallPrompt({
          isStandalone: false,
          dismissedAt: null,
          currentTime: baseTime,
          hasPromptEvent: false,
          isIOS: false,
        })
      ).toBe(false);
    });
  });

  describe("getDismissedAt and setDismissedAt", () => {
    it("saves and retrieves timestamp in storage", () => {
      const mockStorage: Record<string, string> = {};
      const storage = {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
      };

      expect(getDismissedAt(storage)).toBeNull();
      setDismissedAt(12345678, storage);
      expect(getDismissedAt(storage)).toBe(12345678);
    });

    it("gracefully catches storage errors", () => {
      const faultyStorage = {
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      };

      expect(getDismissedAt(faultyStorage)).toBeNull();
      expect(() => setDismissedAt(12345, faultyStorage)).not.toThrow();
    });
  });

  describe("checkIsIOS", () => {
    it("identifies iPhone / iPad user agents correctly", () => {
      expect(
        checkIsIOS(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        )
      ).toBe(true);
      expect(
        checkIsIOS(
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        )
      ).toBe(true);
      expect(
        checkIsIOS(
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36"
        )
      ).toBe(false);
    });
  });
});
