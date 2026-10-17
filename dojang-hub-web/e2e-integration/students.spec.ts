import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, loginAs, projectTag, shot } from "./helpers";

test("ketua menambah siswa (aturan kontak & wali) lalu siswa muncul di daftar", async ({ page, request }, testInfo) => {
  const name = `Siswa Uji ${projectTag(testInfo)}${Date.now().toString().slice(-6)}`;
  await loginAs(page, request, "ketua");
  await page.goto("/academy/students/new");
  // Tunggu form hidrasi & daftar kelas termuat agar submit tidak menjadi navigasi form native.
  await expect(page.getByLabel("Kelas utama").locator("option", { hasText: "SDN-01 Palembang" })).toBeAttached();
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Nama siswa").fill(name);
  await page.getByLabel("Tanggal lahir").fill("2014-05-10");
  await page.getByLabel("Tanggal bergabung").fill("2026-01-05");
  await page.getByLabel("Kelas utama").selectOption({ label: "SDN-01 Palembang" });
  await page.getByLabel("Tingkatan").selectOption({ index: 1 });

  // Aturan 1: minimal satu kontak. Aturan 2: siswa < 17 tahun wajib nama + nomor wali.
  await page.getByRole("button", { name: "Simpan Siswa" }).click();
  // Field wali ber-atribut required untuk siswa < 17 tahun -> diblokir validasi browser.
  await expect(page.getByLabel("Nama wali")).toHaveJSProperty("validity.valueMissing", true);
  await expect(page).toHaveURL(/\/students\/new/);
  await shot(page, testInfo, "student-validation");

  await page.getByLabel("Nama wali").fill("Wali Uji");
  await page.getByLabel("Nomor wali").fill("081200009999");
  await page.getByRole("button", { name: "Simpan Siswa" }).click();

  await expect(page).toHaveURL(/\/academy\/students$/);
  await page.getByPlaceholder("Cari siswa").fill(name);
  await expect(page.getByText(name).locator("visible=true").first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot(page, testInfo, "student-created");
});
