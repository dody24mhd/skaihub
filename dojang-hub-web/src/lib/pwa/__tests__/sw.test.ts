import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Service Worker (public/sw.js)", () => {
  const rootDir = path.resolve(__dirname, "../../../..");
  const swPath = path.join(rootDir, "public", "sw.js");

  it("should exist and define version skaihub-v1", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('VERSION = "skaihub-v1"');
  });

  it("should precache /offline, icons, and fonts", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('"/offline"');
    expect(content).toContain('"/icons/icon-192.png"');
    expect(content).toContain('"/icons/icon-512.png"');
    expect(content).toContain('"/icons/icon-maskable-512.png"');
    expect(content).toContain('"/icons/apple-touch-icon-180.png"');
    expect(content).toContain('"/fonts/Inter-Regular.woff2"');
    expect(content).toContain('"/fonts/Montserrat-Regular.woff2"');
  });

  it("should handle SKIP_WAITING and LOGOUT messages", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("SKIP_WAITING");
    expect(content).toContain("LOGOUT");
  });

  it("should bypass cross-origin requests and requests with Authorization header", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("url.origin !== self.location.origin");
    expect(content).toContain('event.request.headers.has("Authorization")');
  });

  it("should use cache-first for _next/static/", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('url.pathname.startsWith("/_next/static/")');
  });

  it("should handle /academy with network-first and fallback to /offline without caching HTML", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain('url.pathname.startsWith("/academy")');
    expect(content).toContain('caches.match("/offline")');
    // Ensure cache.put is not called inside /academy block
    const academyBlock = content.split('url.pathname.startsWith("/academy")')[1].split("return;")[0];
    expect(academyBlock).not.toContain("cache.put");
  });
});
