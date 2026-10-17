import { defineConfig } from "@playwright/test";

// E2E integrasi: browser -> Next production build -> API Laravel asli (SQLite sementara).
const WEB_PORT = 3910;
const API_PORT = 8010;
const BASE_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}/api`;

export default defineConfig({
  testDir: "./e2e-integration",
  testMatch: /.*\.spec\.ts/,
  outputDir: "./test-results-integration",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
  // INTEGRATION_NO_SERVER=1: pakai server yang sudah berjalan (khusus iterasi lokal).
  webServer: process.env.INTEGRATION_NO_SERVER ? undefined : [
    {
      command: "node e2e-integration/start-api.mjs",
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: "ignore",
    },
    {
      command: `npm run build && npm run start -- -p ${WEB_PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 900_000,
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        NEXT_PUBLIC_BASE_DOMAIN: `localhost:${WEB_PORT}`,
      },
    },
  ],
});
