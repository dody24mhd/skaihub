import { Page, Route } from "@playwright/test";
import { L3C_STUDENTS } from "./mock-api-students-spp";

// Fixture L4-B (pengaturan SPP, Terlambat, tunggakan, kwitansi). Didaftarkan setelah fixture L3-C
// agar diprioritaskan; request lain diteruskan dengan route.fallback().

export const L4B_PAYMENT_ID = 77;
export const L4B_RECEIPT_NUMBER = "KW-202610-0003";

function bill(id: number, studentIndex: number, status: string, paid: string, isOverdue: boolean) {
  const owner = L3C_STUDENTS[studentIndex];
  return {
    id,
    akademi_id: 1,
    student_id: owner.id,
    class_id: owner.primary_class_id,
    billing_year: 2026,
    billing_month: 10,
    amount: "150000.00",
    paid_amount: paid,
    due_date: "2026-10-10",
    status,
    notes: null,
    is_overdue: isOverdue,
    student: owner,
    payments: [] as Record<string, unknown>[],
  };
}

const BILLS = [bill(1, 0, "unpaid", "0.00", true), bill(2, 1, "partial", "50000.00", false), bill(3, 2, "paid", "150000.00", false)];

const PAYMENT = {
  id: L4B_PAYMENT_ID,
  spp_bill_id: 1,
  receipt_number: L4B_RECEIPT_NUMBER,
  amount: "150000.00",
  paid_at: "2026-10-17",
  method: "cash",
  proof_url: null,
  notes: null,
  created_by: 1,
};

const ARREARS = [
  {
    student: { ...L3C_STUDENTS[0], primary_class: { id: 1, name: "Reguler Sore" } },
    months_count: 2,
    total_remaining: "300000.00",
    oldest_due_date: "2026-09-10",
  },
];

const RECEIPT = {
  id: L4B_PAYMENT_ID,
  receipt_number: L4B_RECEIPT_NUMBER,
  akademi: { name: "Dojang Garuda", logo_url: null },
  student: {
    id: L3C_STUDENTS[0].id,
    name: L3C_STUDENTS[0].name,
    member_number: L3C_STUDENTS[0].member_number,
    student_phone: L3C_STUDENTS[0].student_phone,
    guardian_name: L3C_STUDENTS[0].guardian_name,
    guardian_phone: L3C_STUDENTS[0].guardian_phone,
  },
  class_name: "Reguler Sore",
  billing_year: 2026,
  billing_month: 10,
  amount: "150000.00",
  bill_amount: "150000.00",
  remaining_amount: "0.00",
  method: "cash",
  paid_at: "2026-10-17",
  received_by: "Ketua Dojang",
  notes: null,
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function setupSppL4bMockApi(page: Page) {
  let settings: { default_monthly_amount: string | null; due_day: number } = { default_monthly_amount: "150000.00", due_day: 10 };

  await page.route("**/api/akademi/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, "");
    const method = route.request().method();

    if (path === "/akademi/spp-settings" && method === "PUT") {
      const payload = route.request().postDataJSON() as { default_monthly_amount: number | null; due_day: number };
      settings = {
        default_monthly_amount: payload.default_monthly_amount === null ? null : payload.default_monthly_amount.toFixed(2),
        due_day: payload.due_day,
      };
      return json(route, { spp_settings: settings });
    }
    if (path === "/akademi/spp-settings") return json(route, { spp_settings: settings });
    if (path === "/akademi/spp-bills/arrears") return json(route, { data: ARREARS });
    if (path === "/akademi/spp-bills/1/payments" && method === "POST") {
      return json(route, { spp_bill: { ...BILLS[0], status: "paid", paid_amount: "150000.00", is_overdue: false, payments: [PAYMENT] } });
    }
    if (path === `/akademi/spp-payments/${L4B_PAYMENT_ID}/receipt`) return json(route, { receipt: RECEIPT });
    if (path === "/akademi/spp-bills" && method === "GET") {
      return json(route, { data: { data: BILLS, current_page: 1, last_page: 1, total: BILLS.length, per_page: 50 } });
    }

    return route.fallback();
  });
}
