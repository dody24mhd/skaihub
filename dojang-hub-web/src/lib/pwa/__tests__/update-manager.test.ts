import { describe, expect, it, vi } from "vitest";
import {
  handleApplyUpdate,
  isUpdateAvailable,
  shouldRegisterServiceWorker,
} from "../update-manager";

describe("PWA Update Manager", () => {
  describe("shouldRegisterServiceWorker", () => {
    it("returns true only in production when serviceWorker is supported", () => {
      expect(shouldRegisterServiceWorker("production", true)).toBe(true);
      expect(shouldRegisterServiceWorker("production", false)).toBe(false);
      expect(shouldRegisterServiceWorker("development", true)).toBe(false);
      expect(shouldRegisterServiceWorker("test", true)).toBe(false);
      expect(shouldRegisterServiceWorker(undefined, true)).toBe(false);
    });
  });

  describe("isUpdateAvailable", () => {
    it("returns true when waiting worker exists and active controller exists", () => {
      expect(isUpdateAvailable({ waiting: {} }, true)).toBe(true);
      expect(isUpdateAvailable({ waiting: {} }, false)).toBe(false);
      expect(isUpdateAvailable({ waiting: null }, true)).toBe(false);
      expect(isUpdateAvailable(null, true)).toBe(false);
      expect(isUpdateAvailable(undefined, true)).toBe(false);
    });
  });

  describe("handleApplyUpdate", () => {
    it("posts SKIP_WAITING message to waiting worker and returns true", () => {
      const postMessageMock = vi.fn();
      const registration = {
        waiting: { postMessage: postMessageMock },
      };

      const result = handleApplyUpdate(registration);
      expect(result).toBe(true);
      expect(postMessageMock).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });

    it("returns false if there is no waiting worker", () => {
      expect(handleApplyUpdate(null)).toBe(false);
      expect(handleApplyUpdate(undefined)).toBe(false);
      expect(handleApplyUpdate({})).toBe(false);
    });
  });
});
