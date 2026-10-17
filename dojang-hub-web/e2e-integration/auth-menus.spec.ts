import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { ACCOUNTS, PASSWORD, loginAs, openNavIfMobile, shot, type AccountKey } from "./helpers";

async function loginViaForm(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email admin").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk ke Admin" }).click();
}

async function visibleHrefs(page: Page, prefix: string): Promise<string[]> {
  const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll((nodes) =>
    nodes
      .filter((node) => (node as HTMLElement).offsetParent !== null)
      .map((node) => node.getAttribute("href") as string),
  );
  return Array.from(new Set(hrefs));
}

test.describe("login per role & menu sesuai role (backend asli)", () => {
  const academyRoles: Array<{ key: AccountKey; has: string[]; hasNot: string[] }> = [
    {
      key: "ketua",
      has: ["/academy/spp", "/academy/finance", "/academy/users", "/academy/ranks", "/academy/public-profile", "/academy/students"],
      hasNot: ["/internal"],
    },
    {
      key: "admin",
      has: ["/academy/spp", "/academy/users", "/academy/students"],
      hasNot: ["/academy/finance", "/internal"],
    },
    {
      key: "pelatih",
      has: ["/academy/students", "/academy/attendance", "/academy/rank-promotions"],
      hasNot: ["/academy/spp", "/academy/finance", "/academy/users", "/academy/ranks", "/academy/public-profile"],
    },
  ];

  for (const role of academyRoles) {
    test(`login form ${role.key} -> /academy dan menu benar`, async ({ page }, testInfo: TestInfo) => {
      await loginViaForm(page, ACCOUNTS[role.key].email);
      await expect(page).toHaveURL(/\/academy$/);
      await expect(page.getByTestId("app-shell")).toBeVisible();
      await expect(page.getByText("Kelas Hari Ini").first()).toBeVisible();

      await openNavIfMobile(page, testInfo);
      const hrefs = await visibleHrefs(page, "/");
      for (const href of role.has) expect(hrefs, `${role.key} harus punya ${href}`).toContain(href);
      for (const href of role.hasNot) expect(hrefs, `${role.key} tidak boleh punya ${href}`).not.toContain(href);
      await shot(page, testInfo, `menu-${role.key}`);
    });
  }

  test("login form superadmin -> /internal dan menu internal", async ({ page }, testInfo) => {
    await loginViaForm(page, ACCOUNTS.superAdmin.email);
    await expect(page).toHaveURL(/\/internal$/);
    const hrefs = await visibleHrefs(page, "/internal");
    if (hrefs.length === 0) await page.getByRole("button", { name: "Buka menu" }).click();
    const all = await visibleHrefs(page, "/internal");
    expect(all).toContain("/internal/akademi");
    expect(all).not.toContain("/academy/spp");
    await shot(page, testInfo, "menu-superadmin");
  });

  test("password salah ditolak dengan pesan", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email admin").fill(ACCOUNTS.admin.email);
    await page.getByLabel("Password", { exact: true }).fill("salah-salah");
    await page.getByRole("button", { name: "Masuk ke Admin" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("p.text-secondary, p[role='alert']").first()).toBeVisible();
  });

  test("pelatih tidak bisa memakai /academy/spp", async ({ page, request }, testInfo) => {
    await loginAs(page, request, "pelatih");
    await page.goto("/academy/spp");
    await expect(page.getByText(/Akses ditolak/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Tagihan Bulan Ini" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bayar", exact: true })).toHaveCount(0);
    await shot(page, testInfo, "pelatih-spp-denied");
  });
});
