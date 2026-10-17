import { Page, Route } from "@playwright/test";
import { L3C_STUDENTS } from "./mock-api-students-spp";

// Fixture L4-E (form siswa & salin variabel penilaian). Didaftarkan paling akhir agar
// diprioritaskan Playwright; request lain diteruskan dengan route.fallback().

const SOURCE_PERIOD = {
  id: 1,
  akademi_id: 1,
  name: "Semester Ganjil 2026/2027",
  starts_at: "2026-07-01",
  ends_at: "2026-12-31",
  status: "active" as const,
  notes: null,
  aspects_count: 2,
};

const TARGET_PERIOD = {
  id: 2,
  akademi_id: 1,
  name: "Semester Genap 2027",
  starts_at: "2027-01-01",
  ends_at: "2027-06-30",
  status: "draft" as const,
  notes: null,
  aspects_count: 0,
};

const SOURCE_ASPECTS = [
  { id: 1, akademi_id: 1, evaluation_period_id: 1, name: "Kicking (Tae)", category: "Teknik", sort_order: 1, is_active: true, description: null },
  { id: 2, akademi_id: 1, evaluation_period_id: 1, name: "Disiplin", category: "Sikap", sort_order: 2, is_active: true, description: null },
];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function setupL4eMockApi(page: Page) {
  let targetAspects: typeof SOURCE_ASPECTS = [];

  await page.route("**/api/akademi/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, "");
    const method = route.request().method();

    if (method === "POST" && path === "/akademi/students") {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      return json(route, { student: { ...L3C_STUDENTS[0], ...payload, id: 99, member_number: "TKD-0099" } }, 201);
    }

    if (method === "POST" && path === "/akademi/evaluations/periods/2/aspects/copy-from/1") {
      targetAspects = SOURCE_ASPECTS.map((aspect) => ({ ...aspect, id: aspect.id + 10, evaluation_period_id: 2 }));
      return json(route, { data: targetAspects, copied_count: targetAspects.length }, 201);
    }

    if (method !== "GET") return route.fallback();

    if (path === "/akademi/evaluations/periods") {
      return json(route, { data: [{ ...TARGET_PERIOD, aspects_count: targetAspects.length }, SOURCE_PERIOD] });
    }
    if (path === "/akademi/evaluations/periods/1/aspects") return json(route, { data: SOURCE_ASPECTS });
    if (path === "/akademi/evaluations/periods/2/aspects") return json(route, { data: targetAspects });

    return route.fallback();
  });
}
