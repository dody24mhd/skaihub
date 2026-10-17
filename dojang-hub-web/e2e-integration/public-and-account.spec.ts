import { expect, test } from "@playwright/test";
import { API_URL, api, apiLogin, expectNoHorizontalScroll, projectTag, shot } from "./helpers";

test("landing page publik akademi Pro (garuda-sakti) tampil dengan data profil", async ({ page }, testInfo) => {
  await page.goto("/a/garuda-sakti");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/Garuda Sakti/i);
  await expect(page.getByText(/Daftar Trial via WhatsApp/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coach Dimas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SDN-01 Palembang" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot(page, testInfo, "landing-garuda-sakti");

  const missing = await page.goto("/a/akademi-tidak-ada");
  expect(missing?.status()).toBe(404);
});

test("ganti password: user sekali pakai ganti password lewat UI, sesi lain dicabut", async ({ page, request }, testInfo) => {
  const email = `uji.password.${projectTag(testInfo).toLowerCase()}${Date.now()}@garudasakti.test`;
  const oldPassword = "Awal-Pass-123";
  const newPassword = "Baru-Pass-4567";

  // Arrange: user pelatih sekali pakai (dibuat oleh ketua) -> tidak menyentuh akun demo.
  const created = await api(request, "ketua", "POST", "/akademi/users", {
    name: "Pelatih Uji Password",
    email,
    password: oldPassword,
    password_confirmation: oldPassword,
    role: "pelatih",
  });
  expect(created.status, JSON.stringify(created.body)).toBe(201);
  const otherDevice = await apiLogin(request, email, oldPassword); // sesi "perangkat lain"

  // Login lewat form.
  await page.goto("/login");
  await page.getByLabel("Email admin").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByRole("button", { name: "Masuk ke Admin" }).click();
  await expect(page).toHaveURL(/\/academy$/);

  await page.goto("/academy/account");
  await page.waitForLoadState("networkidle");

  // Konfirmasi tidak cocok ditolak di klien.
  await page.locator("#current-password").fill(oldPassword);
  await page.locator("#new-password").fill(newPassword);
  await page.locator("#new-password-confirmation").fill("Beda-Pass-0000");
  await page.getByRole("button", { name: "Simpan Password" }).click();
  await expect(page.getByText("Konfirmasi password baru tidak cocok.")).toBeVisible();

  // Password lama salah -> 422 dari backend.
  await page.locator("#current-password").fill("salah-total-1");
  await page.locator("#new-password-confirmation").fill(newPassword);
  await page.getByRole("button", { name: "Simpan Password" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  // Berhasil.
  await page.locator("#current-password").fill(oldPassword);
  await page.getByRole("button", { name: "Simpan Password" }).click();
  await expect(page.getByText(/Password berhasil diubah/)).toBeVisible();
  await shot(page, testInfo, "password-changed");

  // Backend: password lama tidak berlaku, baru berlaku, token perangkat lain dicabut, sesi ini tetap hidup.
  const oldLogin = await request.post(`${API_URL}/auth/login`, { data: { email, password: oldPassword }, headers: { Accept: "application/json" } });
  expect(oldLogin.status()).toBe(422);
  const newLogin = await request.post(`${API_URL}/auth/login`, { data: { email, password: newPassword }, headers: { Accept: "application/json" } });
  expect(newLogin.ok()).toBeTruthy();
  const revoked = await request.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${otherDevice.token}`, Accept: "application/json" } });
  expect(revoked.status()).toBe(401);
  await page.reload();
  await expect(page.locator("#current-password")).toBeVisible();
});
