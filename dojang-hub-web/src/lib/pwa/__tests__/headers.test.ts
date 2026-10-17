import { describe, expect, it } from "vitest";
import nextConfig from "../../../../next.config";

describe("Next.js Security & PWA Headers", () => {
  it("defines the required security, sw, and manifest headers", async () => {
    expect(typeof nextConfig.headers).toBe("function");

    const headerConfigs = await nextConfig.headers!();

    // Check global headers
    const globalHeader = headerConfigs.find((h) => h.source === "/(.*)");
    expect(globalHeader).toBeDefined();
    expect(globalHeader?.headers).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
    expect(globalHeader?.headers).toContainEqual({
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    });

    // Check sw.js headers
    const swHeader = headerConfigs.find((h) => h.source === "/sw.js");
    expect(swHeader).toBeDefined();
    expect(swHeader?.headers).toContainEqual({
      key: "Cache-Control",
      value: "no-cache, no-store, must-revalidate",
    });
    expect(swHeader?.headers).toContainEqual({
      key: "Content-Type",
      value: "application/javascript; charset=utf-8",
    });

    // Check manifest headers
    const manifestHeader = headerConfigs.find(
      (h) => h.source === "/manifest-academy.webmanifest"
    );
    expect(manifestHeader).toBeDefined();
    expect(manifestHeader?.headers).toContainEqual({
      key: "Content-Type",
      value: "application/manifest+json",
    });
  });
});
