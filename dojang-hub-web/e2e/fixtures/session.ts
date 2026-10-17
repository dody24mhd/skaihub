import { Page } from "@playwright/test";

export type SessionOptions = {
  token?: string;
  role?: string;
  name?: string;
  email?: string;
};

export async function setAdminSession(page: Page, options: SessionOptions = {}) {
  const {
    token = "mock-admin-token-12345",
    role = "ketua_akademi",
    name = "Ketua Akademi Dojang",
    email = "ketua@dojang.test",
  } = options;

  await page.addInitScript(
    ({ token, role, name, email }) => {
      localStorage.setItem("skaihub_admin_token", token);
      localStorage.setItem("skaihub_admin_role", role);
      localStorage.setItem("skaihub_admin_name", name);
      localStorage.setItem("skaihub_admin_email", email);
    },
    { token, role, name, email }
  );
}
