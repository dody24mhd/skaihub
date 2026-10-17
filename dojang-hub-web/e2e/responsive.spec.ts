import { expect as playwrightExpect, test as playwrightTest } from "@playwright/test";
import fs from "fs";
import path from "path";
import { setupMockApi } from "./fixtures/mock-api";
import { setupStudentsSppMockApi } from "./fixtures/mock-api-students-spp";
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
    "/academy/students",
    "/academy/students/new",
    "/academy/students/1",
    "/academy/spp",
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
          await setupStudentsSppMockApi(page);

          // Navigasi ke rute
          await page.goto(route);
          await page.waitForLoadState("domcontentloaded");

          await page.waitForLoadState("networkidle");

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

  playwrightTest.describe("Siswa & SPP di HP (L3-C)", () => {
    playwrightTest.beforeEach(async ({ page }, testInfo) => {
      playwrightTest.skip(testInfo.project.name !== "mobile", "Alur khusus HP");
      await setAdminSession(page);
      await setupMockApi(page);
      await setupStudentsSppMockApi(page);
    });

    playwrightTest("daftar siswa tampil sebagai kartu dan filter dapat dipakai", async ({ page }) => {
      await page.goto("/academy/students");
      const cards = page.getByTestId("responsive-list-card");
      await playwrightExpect(cards).toHaveCount(3);
      await playwrightExpect(cards.first()).toContainText("Reguler Sore");

      const studentsRequest = page.waitForRequest((request) => request.url().includes("/akademi/students?") && request.url().includes("status=alumni"));
      await page.getByLabel("Filter status").selectOption("alumni");
      await studentsRequest;
    });

    playwrightTest("detail siswa menampilkan riwayat sabuk dan prestasi", async ({ page }) => {
      await page.goto("/academy/students/1");
      await playwrightExpect(page.getByRole("heading", { name: "Riwayat Sabuk" })).toBeVisible();
      await playwrightExpect(page.getByText(/UKT Semester 1 2026/)).toBeVisible();
      await playwrightExpect(page.getByText("Juara 1 Kyorugi Kadet -45 kg")).toBeVisible();

      await page.getByRole("button", { name: /tambah prestasi/i }).click();
      await playwrightExpect(page.getByRole("dialog")).toBeVisible();
      await playwrightExpect(page.getByRole("dialog").getByLabel(/Judul prestasi/)).toBeVisible();
    });

    playwrightTest("buat tagihan SPP bulan ini dari SheetModal", async ({ page }) => {
      let payload: Record<string, unknown> | null = null;
      page.on("request", (request) => {
        if (request.method() === "POST" && request.url().includes("/akademi/spp-bills/generate")) {
          payload = request.postDataJSON() as Record<string, unknown>;
        }
      });

      await page.goto("/academy/spp");
      await page.getByRole("button", { name: /buat tagihan bulan ini/i }).click();
      const dialog = page.getByRole("dialog");
      await playwrightExpect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: /^buat tagihan$/i }).click();
      await playwrightExpect(dialog.getByText(/Nominal default wajib diisi/)).toBeVisible();

      await dialog.getByLabel(/Nominal default/).fill("125000");
      await dialog.getByRole("button", { name: /^buat tagihan$/i }).click();

      const result = dialog.getByTestId("spp-generate-result");
      await playwrightExpect(result).toContainText("Dibuat");
      await playwrightExpect(result).toContainText("Dilewati karena nominal kosong");
      playwrightExpect(payload).toMatchObject({ default_amount: 125000, class_id: null });

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      playwrightExpect(hasHorizontalScroll).toBe(false);
    });

    playwrightTest("bayar SPP memakai SheetModal di HP", async ({ page }) => {
      await page.goto("/academy/spp");
      await page.getByRole("button", { name: "Lihat Tagihan" }).first().click();
      const cards = page.getByTestId("responsive-list-card");
      await playwrightExpect(cards).toHaveCount(2);
      await playwrightExpect(cards.first()).toContainText("Sisa");

      await cards.first().getByRole("button", { name: "Bayar" }).click();
      const dialog = page.getByRole("dialog");
      await playwrightExpect(dialog.getByLabel(/Nominal bayar/)).toHaveValue("150000");
      await page.keyboard.press("Escape");
      await playwrightExpect(dialog).toBeHidden();
    });
  });
}
