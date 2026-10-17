import { expect as playwrightExpect, test as playwrightTest } from "@playwright/test";
import fs from "fs";
import path from "path";
import { setupMockApi } from "./fixtures/mock-api";
import { setAdminSession } from "./fixtures/session";
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

const isVitest = typeof process !== "undefined" && Boolean(process.env.VITEST);

if (isVitest) {
  // Bila dieksekusi oleh runner Vitest (npm test), sediakan suite agar tidak gagal "No test suite found".
  // Test browser E2E dijalankan melalui Playwright via `npm run test:e2e`.
  describe("E2E Responsive Specs", () => {
    it("dijalankan via Playwright test runner (npm run test:e2e)", () => {
      // test placeholder yang sukses di Vitest
    });
  });
} else {
  const ACADEMY_ROUTES = [
    "/academy",
    "/academy/classes",
    "/academy/coaches",
    "/academy/users",
    "/academy/places",
    "/academy/public-profile",
  ];

  playwrightTest.describe("Responsive Layout & Shell", () => {
    for (const route of ACADEMY_ROUTES) {
      playwrightTest(
        `memverifikasi responsive layout pada ${route}`,
        async ({ page }, testInfo) => {
          const projectName = testInfo.project.name; // 'mobile' | 'tablet' | 'desktop'

          // Siapkan sesi admin dan mock API
          await setAdminSession(page);
          await setupMockApi(page);

          // Navigasi ke rute
          await page.goto(route);
          await page.waitForLoadState("domcontentloaded");

          // 1. Verifikasi tidak ada scroll horizontal
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          playwrightExpect(
            hasHorizontalScroll,
            `Halaman ${route} tidak boleh memiliki scroll horizontal pada ${projectName}`
          ).toBe(false);

          // 2. Bottom nav terlihat HANYA di mobile
          const bottomNav = page.locator('nav[aria-label="Navigasi Bawah"]');
          if (projectName === "mobile") {
            await playwrightExpect(bottomNav).toBeVisible();
          } else {
            await playwrightExpect(bottomNav).toBeHidden();
          }

          // 3. Sidebar terlihat HANYA di desktop
          const sidebar = page.locator("aside");
          if (projectName === "desktop") {
            await playwrightExpect(sidebar).toBeVisible();
          } else {
            await playwrightExpect(sidebar).toBeHidden();
          }

          // 4. Simpan screenshot ke e2e/__screenshots__/
          const screenshotsDir = path.join(
            process.cwd(),
            "e2e",
            "__screenshots__"
          );
          if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
          }

          const safeName =
            route.replace(/\//g, "-").replace(/^-/, "") || "root";
          await page.screenshot({
            path: path.join(screenshotsDir, `${safeName}-${projectName}.png`),
            fullPage: true,
          });
        }
      );
    }
  });
}
