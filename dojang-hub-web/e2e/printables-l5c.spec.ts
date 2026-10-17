import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import { setupMockApi } from "./fixtures/mock-api";
import { L5C_CERTIFICATE_NUMBER, setupPrintablesL5cMockApi } from "./fixtures/mock-api-printables-l5c";
import { setupStudentsSppMockApi } from "./fixtures/mock-api-students-spp";
import { setAdminSession } from "./fixtures/session";

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalScroll).toBe(false);
}

async function expectPrintModeHidesToolbar(page: Page, screenshotName: string) {
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Cetak / Simpan PDF" })).toBeHidden();
  await page.screenshot({ path: path.join(process.cwd(), "e2e", "__screenshots__", screenshotName), fullPage: true });
}

// Sama seperti responsive.spec.ts: Vitest (npm test) ikut memungut file ini, jadi sediakan suite kosong.
if (typeof process !== "undefined" && Boolean(process.env.VITEST)) {
  describe("E2E L5-C", () => {
    it("dijalankan via Playwright", () => {});
  });
} else {
  test.describe("Rapor & sertifikat siap cetak (L5-C)", () => {
    test.beforeEach(async ({ page }) => {
      await setAdminSession(page);
      await setupMockApi(page);
      await setupStudentsSppMockApi(page);
      await setupPrintablesL5cMockApi(page);
    });

    test("detail siswa → pilih periode → rapor siap cetak", async ({ page }, testInfo) => {
      await page.goto("/academy/students/1");
      const reportLink = page.getByRole("link", { name: "Cetak Rapor" });
      await expect(reportLink).toHaveAttribute("href", "/academy/students/1/report?period_id=1");
      await reportLink.click();
      await page.waitForURL("**/academy/students/1/report?period_id=1");

      const report = page.getByRole("article", { name: /Rapor Arya Pratama/ });
      await expect(report).toContainText("Semester Ganjil 2026/2027");
      await expect(report).toContainText("Geup 8 (Kuning strip hijau)");
      await expect(report).toContainText("80%");
      await expect(report.getByRole("table", { name: "Nilai per aspek" })).toContainText("Sangat Baik");
      await expect(report).toContainText("Sering terlambat.");
      await expectNoHorizontalScroll(page);
      await expectPrintModeHidesToolbar(page, `academy-student-report-print-${testInfo.project.name}.png`);
    });

    test("peserta UKT lulus → sertifikat siap cetak", async ({ page }, testInfo) => {
      await page.goto("/academy/rank-promotions");
      await page.getByRole("link", { name: /Sertifikat Arya/ }).filter({ visible: true }).first().click();
      await page.waitForURL("**/academy/rank-promotions/1/certificates/1");

      const certificate = page.getByRole("article", { name: /Sertifikat UKT Arya/ });
      await expect(certificate).toContainText(L5C_CERTIFICATE_NUMBER);
      await expect(certificate).toContainText("Geup 8 (Kuning strip hijau)");
      await expect(certificate).toContainText("25 Oktober 2026");
      await expectNoHorizontalScroll(page);
      await expectPrintModeHidesToolbar(page, `academy-rank-certificate-print-${testInfo.project.name}.png`);
    });

    test("sertifikat peserta tidak lulus menampilkan pesan server", async ({ page }) => {
      await page.goto("/academy/rank-promotions/1/certificates/9");

      await expect(page.getByText("Sertifikat hanya tersedia untuk peserta yang lulus.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Cetak / Simpan PDF" })).toHaveCount(0);
    });
  });
}
