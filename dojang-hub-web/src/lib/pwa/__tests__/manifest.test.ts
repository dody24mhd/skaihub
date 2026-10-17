import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Academy PWA Web Manifest", () => {
  const rootDir = path.resolve(__dirname, "../../../..");
  const manifestPath = path.join(rootDir, "public", "manifest-academy.webmanifest");
  const publicDir = path.join(rootDir, "public");

  it("should exist and be valid JSON with correct metadata", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.id).toBe("/academy");
    expect(manifest.name).toBe("SKAIHUB Akademi");
    expect(manifest.short_name).toBe("SKAIHUB");
    expect(manifest.scope).toBe("/academy");
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("portrait");
    expect(manifest.lang).toBe("id");
  });

  it("should have start_url inside scope", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.start_url).toBe("/academy?source=pwa");
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
  });

  it("should have correct theme and background colors", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(manifest.theme_color).toBe("#031636");
    expect(manifest.background_color).toBe("#ffffff");
  });

  it("should include all required icons and all icon files must exist in public/", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    // Verify all icon files exist
    for (const icon of manifest.icons) {
      const cleanPath = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
      const fullPath = path.join(publicDir, cleanPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }

    // Verify maskable icon is present
    const maskableIcon = manifest.icons.find((icon: { purpose?: string }) =>
      icon.purpose?.split(" ").includes("maskable")
    );
    expect(maskableIcon).toBeDefined();

    // Verify 192 and 512 sizes exist
    const has192 = manifest.icons.some((icon: { sizes?: string }) => icon.sizes === "192x192");
    const has512 = manifest.icons.some((icon: { sizes?: string }) => icon.sizes === "512x512");
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });
});
