import { describe, it, expect } from "vitest";
import { resolveRewrite } from "../resolve-rewrite";

describe("resolveRewrite", () => {
  const baseDomain = "localhost:3000";

  describe("Brief required cases", () => {
    it("rewrites admin.localhost:3000/ to /internal", () => {
      const result = resolveRewrite("admin.localhost:3000", "/", baseDomain);
      expect(result).toBe("/internal");
    });

    it("does not rewrite /login on admin subdomain (returns null)", () => {
      const result = resolveRewrite("admin.localhost:3000", "/login", baseDomain);
      expect(result).toBeNull();
    });

    it("does not rewrite /internal/akademi on admin subdomain (returns null)", () => {
      const result = resolveRewrite("admin.localhost:3000", "/internal/akademi", baseDomain);
      expect(result).toBeNull();
    });

    it("rewrites /akademi on admin subdomain to /internal/akademi", () => {
      const result = resolveRewrite("admin.localhost:3000", "/akademi", baseDomain);
      expect(result).toBe("/internal/akademi");
    });

    it("rewrites garuda.localhost:3000/ to /a/garuda", () => {
      const result = resolveRewrite("garuda.localhost:3000", "/", baseDomain);
      expect(result).toBe("/a/garuda");
    });

    it("does not rewrite localhost:3000/academy (returns null)", () => {
      const result = resolveRewrite("localhost:3000", "/academy", baseDomain);
      expect(result).toBeNull();
    });
  });

  describe("Admin subdomain edge cases", () => {
    it("does not rewrite /offline on admin subdomain (returns null)", () => {
      const result = resolveRewrite("admin.localhost:3000", "/offline", baseDomain);
      expect(result).toBeNull();
    });

    it("does not rewrite paths already starting with /internal (e.g. /internal/users)", () => {
      const result = resolveRewrite("admin.localhost:3000", "/internal/users", baseDomain);
      expect(result).toBeNull();
    });

    it("rewrites other paths to /internal${path}", () => {
      expect(resolveRewrite("admin.localhost:3000", "/berita", baseDomain)).toBe("/internal/berita");
      expect(resolveRewrite("admin.localhost:3000", "/event", baseDomain)).toBe("/internal/event");
      expect(resolveRewrite("admin.localhost:3000", "/users", baseDomain)).toBe("/internal/users");
      expect(resolveRewrite("admin.localhost:3000", "/settings", baseDomain)).toBe("/internal/settings");
    });

    it("handles different dev ports (e.g. admin.localhost:3100 with baseDomain localhost:3000)", () => {
      expect(resolveRewrite("admin.localhost:3100", "/", baseDomain)).toBe("/internal");
      expect(resolveRewrite("admin.localhost:3100", "/login", baseDomain)).toBeNull();
      expect(resolveRewrite("admin.localhost:3100", "/akademi", baseDomain)).toBe("/internal/akademi");
    });
  });

  describe("Academy subdomain cases", () => {
    it("rewrites academy paths to /a/:subdomain/:path", () => {
      expect(resolveRewrite("garuda.localhost:3000", "/profil", baseDomain)).toBe("/a/garuda/profil");
      expect(resolveRewrite("tigers.localhost:3000", "/jadwal", baseDomain)).toBe("/a/tigers/jadwal");
    });
  });

  describe("Compro site / main domain cases", () => {
    it("does not rewrite paths on base domain (returns null)", () => {
      expect(resolveRewrite("localhost:3000", "/", baseDomain)).toBeNull();
      expect(resolveRewrite("localhost:3000", "/berita", baseDomain)).toBeNull();
      expect(resolveRewrite("localhost:3000", "/event", baseDomain)).toBeNull();
      expect(resolveRewrite("localhost:3000", "/harga", baseDomain)).toBeNull();
    });

    it("does not rewrite IP addresses (returns null)", () => {
      expect(resolveRewrite("127.0.0.1:3000", "/", baseDomain)).toBeNull();
      expect(resolveRewrite("127.0.0.1:3100", "/admin/akademi", baseDomain)).toBeNull();
    });
  });

  describe("Production domain format", () => {
    const prodBase = "skaihub.com";

    it("works with production domains like admin.skaihub.com", () => {
      expect(resolveRewrite("admin.skaihub.com", "/", prodBase)).toBe("/internal");
      expect(resolveRewrite("admin.skaihub.com", "/login", prodBase)).toBeNull();
      expect(resolveRewrite("admin.skaihub.com", "/akademi", prodBase)).toBe("/internal/akademi");
    });

    it("works with academy subdomains like garuda.skaihub.com", () => {
      expect(resolveRewrite("garuda.skaihub.com", "/", prodBase)).toBe("/a/garuda");
      expect(resolveRewrite("garuda.skaihub.com", "/profil", prodBase)).toBe("/a/garuda/profil");
    });

    it("does not rewrite main production domain skaihub.com", () => {
      expect(resolveRewrite("skaihub.com", "/", prodBase)).toBeNull();
      expect(resolveRewrite("skaihub.com", "/berita", prodBase)).toBeNull();
    });
  });
});
