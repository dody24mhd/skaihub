import { expect, test } from "@playwright/test";
import { setupMockApi } from "./fixtures/mock-api";
import { setAdminSession } from "./fixtures/session";
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

const isVitest = typeof process !== "undefined" && Boolean(process.env.VITEST);

if (isVitest) {
  // Sama seperti responsive.spec.ts: file ini dijalankan Playwright, bukan Vitest.
  describe("E2E Ranks", () => {
    it("dijalankan via Playwright test runner", () => {});
  });
} else {
  test.describe("L4-C sabuk per sistem tingkatan (mobile)", () => {
    test("menampilkan sabuk bawaan terkunci dan menambah sabuk akademi", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "Alur ini khusus HP.");

      await setAdminSession(page);
      await setupMockApi(page);

      await page.goto("/academy/ranks");

      await expect(page.getByText("Sistem Taekwondo Kukkiwon", { exact: false })).toBeVisible();
      await expect(page.locator(":text(\"Bawaan Kukkiwon\"):visible").first()).toBeVisible();
      await expect(page.locator(":text(\"Tambahan akademi\"):visible").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Edit Geup 10 (Putih)" })).toHaveCount(0);
      await expect(
        page.locator('[aria-label="Geup 8 (Kuning Strip Hijau)"] [data-stripe-color="green"]').first()
      ).toBeAttached();

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);

      await page.getByRole("button", { name: "+ Tambah Tingkatan" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Nama tingkatan").fill("Geup 8 Strip Khusus");
      await dialog.getByRole("button", { name: /Kuning/ }).first().click();
      await dialog.getByLabel("Warna strip").selectOption("blue");
      await dialog.getByLabel("Kode").fill("geup-8-strip");
      await dialog.getByLabel("Urutan").fill("35");
      await dialog.getByRole("button", { name: "Simpan" }).click();

      await expect(page.getByText("Tingkatan ditambahkan.")).toBeVisible();
    });
  });
}
