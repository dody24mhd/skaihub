import { expect as playwrightExpect, test as playwrightTest } from "@playwright/test";
import fs from "fs";
import path from "path";
import { setupMockApi } from "./fixtures/mock-api";
import { setupStudentsSppMockApi } from "./fixtures/mock-api-students-spp";
import { L4B_RECEIPT_NUMBER, setupSppL4bMockApi } from "./fixtures/mock-api-spp-l4b";
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
    "/academy/attendance",
    "/academy/attendance/new",
    "/academy/schedules",
    "/academy/classes",
    "/academy/coaches",
    "/academy/users",
    "/academy/places",
    "/academy/public-profile",
    "/academy/evaluations",
    "/academy/evaluation-settings",
    "/academy/rank-promotions",
    "/academy/ranks",
    "/academy/finance",
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
          const sidebar = page.locator("main > aside");
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

  playwrightTest.describe("Alur Pengisian Absensi Latihan (L3-B)", () => {
    playwrightTest(
      "alur isi absensi lengkap pada mobile dengan status sick",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "mobile") return;

        interface CapturedAttendancePayload {
          status?: string;
          material?: string;
          attendances?: Array<{ id: number; status: string }>;
        }
        let capturedPayload: CapturedAttendancePayload | null = null;

        await setAdminSession(page);
        await setupMockApi(page);

        // Intercept request PATCH attendance untuk memeriksa payload
        await page.route("**/api/akademi/training-sessions/1/attendance", async (route) => {
          if (route.request().method() === "PATCH") {
            capturedPayload = route.request().postDataJSON() as CapturedAttendancePayload;
          }
          await route.fallback();
        });

        // Navigasi ke form absensi sesi 1
        await page.goto("/academy/attendance/new?session=1");
        await page.waitForLoadState("domcontentloaded");

        // 1. Verifikasi kartu siswa terlihat
        const studentCard = page.locator('[data-testid="attendance-card-1"]');
        await playwrightExpect(studentCard).toBeVisible();

        // 2. Klik tombol Sakit untuk siswa pertama
        const sickBtn = studentCard.getByRole("button", { name: /^sakit/i });
        await playwrightExpect(sickBtn).toBeVisible();
        await sickBtn.click();
        await playwrightExpect(sickBtn).toHaveAttribute("aria-pressed", "true");

        // 3. Simpan Draft
        const saveDraftBtn = page.getByRole("button", { name: /simpan draft/i });
        await saveDraftBtn.click();

        // 4. Verifikasi notifikasi berhasil
        const successMsg = page.getByText(/absensi disimpan/i);
        await playwrightExpect(successMsg).toBeVisible();

        // 5. Validasi payload yang dikirim ke backend berisi status 'sick'
        const payload = capturedPayload as CapturedAttendancePayload | null;
        playwrightExpect(payload).not.toBeNull();
        const studentAtt = payload?.attendances?.find((a) => a.id === 1);
        playwrightExpect(studentAtt).toBeDefined();
        playwrightExpect(studentAtt?.status).toBe("sick");
      }
    );
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

  // L4-B
  playwrightTest.describe("SPP: pengaturan, Terlambat, tunggakan, kwitansi di HP (L4-B)", () => {
    playwrightTest.beforeEach(async ({ page }, testInfo) => {
      playwrightTest.skip(testInfo.project.name !== "mobile", "Alur khusus HP");
      await setAdminSession(page);
      await setupMockApi(page);
      await setupStudentsSppMockApi(page);
      await setupSppL4bMockApi(page);
    });

    playwrightTest("pengaturan SPP disimpan dari SheetModal", async ({ page }) => {
      await page.goto("/academy/spp");
      await page.getByRole("button", { name: "Pengaturan SPP" }).click();
      const dialog = page.getByRole("dialog");
      await playwrightExpect(dialog.getByLabel(/Nominal SPP default/)).toHaveValue("150000");

      await dialog.getByLabel(/Nominal SPP default/).fill("175000");
      await dialog.getByLabel(/Tanggal jatuh tempo/).fill("5");
      const saveRequest = page.waitForRequest((request) => request.method() === "PUT" && request.url().includes("/akademi/spp-settings"));
      await dialog.getByRole("button", { name: /simpan pengaturan/i }).click();
      playwrightExpect((await saveRequest).postDataJSON()).toEqual({ default_monthly_amount: 175000, due_day: 5 });

      await playwrightExpect(page.getByText("Pengaturan SPP tersimpan.")).toBeVisible();
      await playwrightExpect(dialog).toBeHidden();
    });

    playwrightTest("tagihan terlambat ditandai, tab Tunggakan tampil", async ({ page }) => {
      await page.goto("/academy/spp");
      await page.getByRole("button", { name: "Lihat Tagihan" }).first().click();
      const cards = page.getByTestId("responsive-list-card");
      await playwrightExpect(cards.first().getByText("Terlambat")).toBeVisible();
      await playwrightExpect(cards.nth(1).getByText("Terlambat")).toHaveCount(0);

      await page.getByRole("button", { name: "Tunggakan" }).click();
      await playwrightExpect(page.getByTestId("responsive-list-card").first()).toContainText("2 bulan");

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      playwrightExpect(hasHorizontalScroll).toBe(false);
    });

    playwrightTest("bayar lalu buka kwitansi yang bisa dibagikan via WhatsApp", async ({ page }) => {
      await page.goto("/academy/spp");
      await page.getByRole("button", { name: "Lihat Tagihan" }).first().click();
      await page.getByTestId("responsive-list-card").first().getByRole("button", { name: "Bayar" }).click();
      await page.getByRole("dialog").getByRole("button", { name: /simpan pembayaran/i }).click();

      await page.getByRole("link", { name: "Lihat kwitansi" }).click();
      await page.waitForURL("**/academy/spp/receipts/77");

      const receipt = page.getByRole("article", { name: /Kwitansi SPP/ });
      await playwrightExpect(receipt).toContainText(L4B_RECEIPT_NUMBER);
      await playwrightExpect(receipt).toContainText("Oktober 2026");
      await playwrightExpect(page.getByRole("button", { name: /Cetak/ })).toBeVisible();
      const whatsapp = page.getByRole("link", { name: /Bagikan via WhatsApp/ });
      await playwrightExpect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/6281200000000\?text=/);

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      playwrightExpect(hasHorizontalScroll).toBe(false);

      await page.emulateMedia({ media: "print" });
      await playwrightExpect(page.getByRole("button", { name: /Cetak/ })).toBeHidden();
      await page.screenshot({ path: path.join(process.cwd(), "e2e", "__screenshots__", "academy-spp-receipt-print-mobile.png"), fullPage: true });
    });
  });
}
