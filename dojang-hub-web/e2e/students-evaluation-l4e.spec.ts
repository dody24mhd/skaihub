import { expect, test } from "@playwright/test";
import { setupL4eMockApi } from "./fixtures/mock-api-l4e";
import { setupMockApi } from "./fixtures/mock-api";
import { setupStudentsSppMockApi } from "./fixtures/mock-api-students-spp";
import { setAdminSession } from "./fixtures/session";

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

// Sama seperti responsive.spec.ts: Vitest (npm test) ikut memungut file ini, jadi sediakan suite kosong.
if (typeof process !== "undefined" && Boolean(process.env.VITEST)) {
  describe("E2E L4-E", () => {
    it("dijalankan via Playwright", () => {});
  });
} else {
  test.describe("Data siswa & penilaian di HP (L4-E)", () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "Alur khusus HP");
      await setAdminSession(page);
      await setupMockApi(page);
      await setupStudentsSppMockApi(page);
      await setupL4eMockApi(page);
    });

    test("form siswa: kontak wajib, wali wajib di bawah 17 tahun, fisik opsional", async ({ page }) => {
      let payload: Record<string, unknown> | null = null;
      page.on("request", (request) => {
        if (request.method() === "POST" && request.url().endsWith("/akademi/students")) {
          payload = request.postDataJSON() as Record<string, unknown>;
        }
      });

      await page.goto("/academy/students/new");
      await page.getByLabel(/Nama siswa/).fill("Rara Anindya");
      await page.getByLabel(/Tanggal lahir/).fill("1995-03-10");

      await expect(page.getByLabel(/Tinggi badan/)).not.toHaveAttribute("required", "");
      await expect(page.getByText("Opsional").first()).toBeVisible();

      await page.getByRole("button", { name: /simpan siswa/i }).click();
      await expect(page.getByText("Isi minimal satu nomor kontak: nomor siswa atau nomor wali.")).toBeVisible();
      expect(payload).toBeNull();

      await page.getByLabel(/Tanggal lahir/).fill("2015-03-10");
      // Sudah pernah submit: hint wali diganti pesan error inline.
      await expect(page.getByText("Nama wali wajib diisi untuk siswa di bawah 17 tahun.")).toBeVisible();
      await expect(page.getByLabel(/Nama wali/)).toHaveAttribute("required", "");
      await expect(page.getByLabel(/Nomor wali/)).toHaveAttribute("required", "");

      await page.getByLabel(/Nama wali/).fill("Ibu Anindya");
      await page.getByLabel(/Nomor wali/).fill("081200001234");
      await page.getByRole("button", { name: /simpan siswa/i }).click();

      await page.waitForURL("**/academy/students");
      expect(payload).toMatchObject({
        name: "Rara Anindya",
        guardian_name: "Ibu Anindya",
        guardian_phone: "081200001234",
        student_phone: null,
        height_cm: null,
        weight_kg: null,
      });
    });

    test("form siswa tidak scroll horizontal di 375px", async ({ page }) => {
      await page.goto("/academy/students/new");
      await expect(page.getByLabel(/Nama siswa/)).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasHorizontalScroll).toBe(false);
    });

    test("salin variabel dari periode sebelumnya", async ({ page }) => {
      await page.goto("/academy/evaluation-settings");

      const targetCard = page.getByTestId("responsive-list-card").filter({ hasText: "Semester Genap 2027" });
      await targetCard.getByRole("button", { name: /Kelola/ }).click();
      await expect(page.getByText("Belum ada variabel untuk periode ini.")).toBeVisible();

      await page.getByRole("button", { name: "Salin dari periode sebelumnya" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByLabel(/Periode sumber/)).toHaveValue("1");
      await expect(dialog.getByText(/2 variabel akan disalin/)).toBeVisible();

      const copyRequest = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("/aspects/copy-from/1"));
      await dialog.getByRole("button", { name: "Salin Variabel" }).click();
      await copyRequest;

      await expect(dialog).toBeHidden();
      await expect(page.getByText("2 variabel disalin dari Semester Ganjil 2026/2027.")).toBeVisible();
      await expect(page.getByTestId("responsive-list-card").filter({ hasText: "Kicking (Tae)" })).toBeVisible();
    });
  });
}
