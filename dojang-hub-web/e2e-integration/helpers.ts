import { expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

export const API_URL = "http://127.0.0.1:8010/api";
export const PASSWORD = "password"; // password akun demo dari seeder (khusus DB integrasi sementara)

export const ACCOUNTS = {
  superAdmin: { email: "superadmin@skaihub.com", role: "super_admin" },
  ketua: { email: "ketua@garudasakti.test", role: "ketua_akademi" },
  admin: { email: "admin@garudasakti.test", role: "admin_akademi" },
  pelatih: { email: "dimas@garudasakti.test", role: "pelatih" },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

export type ApiSession = {
  token: string;
  user: { id: number; name: string; email: string; role: string };
};

const sessionCache = new Map<string, ApiSession>();

/**
 * Login lewat API. Token di-cache per worker (hemat login), tetapi backend hanya mengizinkan
 * satu token aktif per user (login baru -> token lama dicabut), sehingga token cache divalidasi
 * lewat /auth/me dan login ulang bila sudah dicabut (mis. oleh login lewat form UI).
 */
export async function apiLogin(request: APIRequestContext, email: string, password = PASSWORD): Promise<ApiSession> {
  const key = `${email}|${password}`;
  const cached = sessionCache.get(key);
  if (cached) {
    const me = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${cached.token}`, Accept: "application/json" },
    });
    if (me.ok()) return cached;
    sessionCache.delete(key);
  }
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
    headers: { Accept: "application/json" },
  });
  expect(res.ok(), `login ${email}: ${res.status()}`).toBeTruthy();
  const session = (await res.json()) as ApiSession;
  sessionCache.set(key, session);
  return session;
}

/** Panggil API sebagai role tertentu. */
export async function api<T = unknown>(
  request: APIRequestContext,
  account: AccountKey,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
): Promise<{ status: number; body: T }> {
  const { token } = await apiLogin(request, ACCOUNTS[account].email);
  const res = await request.fetch(`${API_URL}${path}`, {
    method,
    data,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  return { status: res.status(), body: (text ? JSON.parse(text) : null) as T };
}

/** Pasang sesi login (localStorage) untuk role tertentu tanpa melewati form login. */
export async function loginAs(page: Page, request: APIRequestContext, account: AccountKey) {
  const { token, user } = await apiLogin(request, ACCOUNTS[account].email);
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("skaihub_admin_token", token);
      localStorage.setItem("skaihub_admin_role", user.role);
      localStorage.setItem("skaihub_admin_name", user.name);
      localStorage.setItem("skaihub_admin_email", user.email);
    },
    { token, user },
  );
}

export function projectTag(testInfo: TestInfo): string {
  return testInfo.project.name === "mobile" ? "M" : "D";
}

export function isMobile(testInfo: TestInfo): boolean {
  return testInfo.project.name === "mobile";
}

/** Buka menu "Lainnya" di HP agar tautan sidebar tersedia; di desktop sidebar sudah terlihat. */
export async function openNavIfMobile(page: Page, testInfo: TestInfo) {
  if (!isMobile(testInfo)) return;
  await page.getByRole("button", { name: "Lainnya" }).click();
}

export async function shot(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: `test-results-integration/screens/${testInfo.project.name}-${name}.png`,
    fullPage: true,
  });
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
}
