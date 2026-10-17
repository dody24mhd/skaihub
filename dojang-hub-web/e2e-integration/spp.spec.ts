import { expect, test } from "@playwright/test";
import { api, expectNoHorizontalScroll, loginAs, projectTag, shot } from "./helpers";

const BILL_ROW = 'tr, [data-testid="responsive-list-card"]';
const MONTH_LABELS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

test("admin: generate SPP -> bayar parsial -> lunas -> buka kwitansi", async ({ page, request }, testInfo) => {
  // Periode unik per project agar tidak bentrok dengan tagihan seed (bulan ini) maupun project lain.
  const year = new Date().getFullYear() + 1;
  const month = testInfo.project.name === "mobile" ? 3 : 4;
  const monthLabel = MONTH_LABELS[month - 1];

  // Siswa khusus agar barisnya mudah ditemukan (dibuat lewat API oleh ketua).
  const studentName = `Siswa SPP ${projectTag(testInfo)}${Date.now().toString().slice(-6)}`;
  const classes = await api<{ data: Array<{ id: number; name: string }> }>(request, "ketua", "GET", "/akademi/classes");
  const juniorClass = classes.body.data.find((item) => item.name === "SDN-01 Palembang");
  expect(juniorClass).toBeTruthy();
  const created = await api(request, "ketua", "POST", "/akademi/students", {
    name: studentName,
    gender: "male",
    birth_date: "2014-02-02",
    joined_date: "2026-01-05",
    status: "active",
    primary_class_id: juniorClass!.id,
    guardian_name: "Wali SPP",
    guardian_phone: "081200008888",
  });
  expect(created.status).toBe(201);

  await loginAs(page, request, "admin");
  await page.goto("/academy/spp");
  await page.waitForLoadState("networkidle");

  // --- Generate tagihan untuk periode uji ---
  await page.getByRole("button", { name: "Buat Tagihan Bulan Ini" }).click();
  const generate = page.getByRole("dialog");
  await generate.getByLabel("Bulan").selectOption(String(month));
  await generate.getByLabel("Tahun").fill(String(year));
  await generate.getByRole("button", { name: "Buat Tagihan" }).click();
  await expect(generate.getByText("Dibuat")).toBeVisible();
  await shot(page, testInfo, "spp-generate-result");
  await generate.getByRole("button", { name: "Selesai" }).click();

  // --- Filter ke periode uji, buka kelas siswa ---
  await page.getByLabel("Tahun").fill(String(year));
  await page.getByLabel("Bulan").selectOption(String(month));
  const classRow = page.locator("div.py-4", { hasText: "SDN-01 Palembang" }).first();
  await classRow.getByRole("button", { name: "Lihat Tagihan" }).click();

  const row = page.locator(BILL_ROW, { hasText: studentName }).locator("visible=true").first();
  await expect(row).toBeVisible();
  await expect(row).toContainText(`${monthLabel.slice(0, 3)} ${year}`);
  await expect(row).toContainText("150.000");

  // --- Bayar parsial ---
  await row.getByRole("button", { name: "Bayar", exact: true }).click();
  let pay = page.getByRole("dialog");
  await pay.getByLabel("Nominal bayar").fill("50000");
  await pay.getByRole("button", { name: "Simpan Pembayaran" }).click();
  await expect(page.getByText("Pembayaran SPP tersimpan.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const afterPartial = page.locator(BILL_ROW, { hasText: studentName }).locator("visible=true").first();
  await expect(afterPartial).toContainText("Sebagian");
  await shot(page, testInfo, "spp-partial");

  // --- Lunasi sisa ---
  await afterPartial.getByRole("button", { name: "Bayar", exact: true }).click();
  pay = page.getByRole("dialog");
  await pay.getByLabel("Nominal bayar").fill("100000");
  await pay.getByRole("button", { name: "Simpan Pembayaran" }).click();
  await expect(page.getByText("Pembayaran SPP tersimpan.")).toBeVisible();
  const paidRow = page.locator(BILL_ROW, { hasText: studentName }).locator("visible=true").first();
  await expect(paidRow).toContainText("Lunas");
  await expect(paidRow.getByRole("button", { name: "Bayar", exact: true })).toHaveCount(0);

  // --- Kwitansi (dua pembayaran -> dua tautan; buka yang terakhir) ---
  const receiptLinks = paidRow.getByRole("link", { name: /KW|Kwitansi|\d/ });
  await expect(receiptLinks).toHaveCount(2);
  await receiptLinks.last().click();
  await expect(page).toHaveURL(/\/academy\/spp\/receipts\/\d+/);
  const receipt = page.getByRole("article", { name: /Kwitansi SPP/ });
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText(studentName);
  await expect(receipt).toContainText("100.000");
  await expect(receipt).toContainText("Sisa tagihan");
  await expectNoHorizontalScroll(page);
  await shot(page, testInfo, "spp-receipt");
});
