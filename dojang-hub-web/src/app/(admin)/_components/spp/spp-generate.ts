import { TrainingClass, generateAkademiSppBills } from "../../_lib/admin-api";

export type SppGenerateForm = {
  billing_year: string;
  billing_month: string;
  default_amount: string;
  due_date: string;
  class_id: string;
};

export type SppGenerateResult = Awaited<ReturnType<typeof generateAkademiSppBills>>;

export type SppGenerateSummary = {
  created: number;
  alreadyExists: number;
  missingAmount: number;
};

export function initialGenerateForm(now: Date): SppGenerateForm {
  return {
    billing_year: String(now.getFullYear()),
    billing_month: String(now.getMonth() + 1),
    default_amount: "",
    due_date: "",
    class_id: "",
  };
}

// Backend memakai spp_amount_override kelas utama siswa, lalu default_amount; tanpa keduanya siswa dilewati.
export function needsDefaultAmount(classes: TrainingClass[], classId: string) {
  const targetClasses = classId ? classes.filter((item) => String(item.id) === classId) : classes;
  return targetClasses.some((item) => !item.spp_amount_override);
}

export function generatePayloadFromForm(form: SppGenerateForm) {
  return {
    billing_year: Number(form.billing_year),
    billing_month: Number(form.billing_month),
    default_amount: form.default_amount ? Number(form.default_amount) : null,
    due_date: form.due_date || null,
    class_id: form.class_id ? Number(form.class_id) : null,
  };
}

export function summarizeGenerateResult(result: SppGenerateResult): SppGenerateSummary {
  const missingAmount = result.missing_amount ?? 0;
  return {
    created: result.created,
    alreadyExists: Math.max(result.skipped - missingAmount, 0),
    missingAmount,
  };
}
