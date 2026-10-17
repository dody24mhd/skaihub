import { FormEvent } from "react";
import {
  EvaluationAspect,
  EvaluationPeriod,
  Student,
  copyAkademiEvaluationAspects,
  createAkademiEvaluationPeriod,
  createAkademiEvaluationPeriodAspect,
  deleteAkademiEvaluationAspect,
  downloadAkademiEvaluationExport,
  updateAkademiEvaluationAspect,
  updateAkademiEvaluationPeriod,
  upsertAkademiEvaluationScores,
} from "../../_lib/admin-api";
import { statusLabels } from "./evaluation-types";

export type PeriodHandlerContext = {
  token: string;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  setIsSaving: (saving: boolean) => void;
  setError: (err: string) => void;
  setMessage: (msg: string) => void;
  loadBaseData: (token: string) => Promise<void>;
  setSelectedPeriodId: (id: string) => void;
  setIsPeriodDetailOpen: (open: boolean) => void;
  refreshAll: () => Promise<void>;
};

export async function submitCreatePeriod(
  event: FormEvent<HTMLFormElement>,
  ctx: PeriodHandlerContext
) {
  event.preventDefault();
  const confirmed = window.confirm("Apakah anda yakin mau membuat periode baru?");
  if (!confirmed) return;

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    const result = await createAkademiEvaluationPeriod(ctx.token, {
      name: ctx.periodName,
      starts_at: ctx.periodStart,
      ends_at: ctx.periodEnd,
      status: "draft",
    });
    await ctx.loadBaseData(ctx.token);
    ctx.setSelectedPeriodId(String(result.evaluation_period.id));
    ctx.setIsPeriodDetailOpen(true);
    ctx.setMessage("Periode penilaian dibuat.");
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal membuat periode.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitUpdatePeriodStatus(
  period: EvaluationPeriod,
  status: EvaluationPeriod["status"],
  ctx: Pick<PeriodHandlerContext, "token" | "setIsSaving" | "setError" | "setMessage" | "refreshAll">
) {
  const actionLabel =
    status === "active" ? "aktifkan" : status === "closed" ? "arsipkan" : "ubah ke draft";
  const confirmed = window.confirm(`Yakin ${actionLabel} periode ${period.name}?`);
  if (!confirmed) return;

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    await updateAkademiEvaluationPeriod(ctx.token, period.id, { status });
    await ctx.refreshAll();
    ctx.setMessage(`Status periode menjadi ${statusLabels[status].toLowerCase()}.`);
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal mengubah status periode.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export type AspectHandlerContext = {
  token: string;
  selectedPeriodId: string;
  aspectName: string;
  aspectCategory: string;
  aspectsCount: number;
  setIsSaving: (saving: boolean) => void;
  setError: (err: string) => void;
  setMessage: (msg: string) => void;
  loadAspects: (token: string, periodId: string) => Promise<void>;
  setAspectName: (name: string) => void;
};

export async function submitCreateAspect(
  event: FormEvent<HTMLFormElement>,
  ctx: AspectHandlerContext
) {
  event.preventDefault();
  if (!ctx.selectedPeriodId) {
    ctx.setError("Pilih periode sebelum menambah variabel.");
    return;
  }

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    const result = await createAkademiEvaluationPeriodAspect(ctx.token, ctx.selectedPeriodId, {
      name: ctx.aspectName,
      category: ctx.aspectCategory || null,
      sort_order: ctx.aspectsCount + 1,
    });
    await ctx.loadAspects(ctx.token, ctx.selectedPeriodId);
    ctx.setAspectName("");
    ctx.setMessage(`Aspek ${result.evaluation_aspect.name} ditambahkan.`);
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal menambah aspek.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitUpdateAspect(
  aspect: EvaluationAspect,
  nextName: string,
  nextCategory: string,
  ctx: {
    token: string;
    selectedPeriodId: string;
    setIsSaving: (saving: boolean) => void;
    setError: (err: string) => void;
    setMessage: (msg: string) => void;
    loadAspects: (token: string, periodId: string) => Promise<void>;
    onDone: () => void;
  }
) {
  if (!nextName.trim()) {
    ctx.setError("Nama variabel wajib diisi.");
    return;
  }

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    const result = await updateAkademiEvaluationAspect(ctx.token, aspect.id, {
      name: nextName.trim(),
      category: nextCategory.trim() || null,
    });
    await ctx.loadAspects(ctx.token, ctx.selectedPeriodId);
    ctx.onDone();
    ctx.setMessage(`Variabel ${result.evaluation_aspect.name} diperbarui.`);
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal mengubah variabel.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitDeleteAspect(
  aspect: EvaluationAspect,
  ctx: {
    token: string;
    selectedPeriodId: string;
    setIsSaving: (saving: boolean) => void;
    setError: (err: string) => void;
    setMessage: (msg: string) => void;
    loadAspects: (token: string, periodId: string) => Promise<void>;
    onDone: () => void;
  }
) {
  const confirmed = window.confirm(`Apakah kamu yakin mau hapus variabel ${aspect.name}?`);
  if (!confirmed) return;

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    await deleteAkademiEvaluationAspect(ctx.token, aspect.id);
    await ctx.loadAspects(ctx.token, ctx.selectedPeriodId);
    ctx.onDone();
    ctx.setMessage(`Variabel ${aspect.name} dihapus.`);
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal menghapus variabel.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitCopyAspects(
  source: EvaluationPeriod,
  ctx: {
    token: string;
    selectedPeriodId: string;
    setIsSaving: (saving: boolean) => void;
    setError: (err: string) => void;
    setMessage: (msg: string) => void;
    refreshAll: () => Promise<void>;
  }
): Promise<boolean> {
  if (!ctx.selectedPeriodId) return false;

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    const result = await copyAkademiEvaluationAspects(ctx.token, Number(ctx.selectedPeriodId), source.id);
    await ctx.refreshAll();
    ctx.setMessage(
      result.copied_count > 0
        ? `${result.copied_count} variabel disalin dari ${source.name}.`
        : `Semua variabel ${source.name} sudah ada di periode ini.`
    );
    return true;
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal menyalin variabel.");
    return false;
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitExportScores(ctx: {
  token: string;
  selectedPeriodId: string;
  classFilter: string;
  setIsSaving: (saving: boolean) => void;
  setError: (err: string) => void;
  setMessage: (msg: string) => void;
}) {
  if (!ctx.selectedPeriodId) return;

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    await downloadAkademiEvaluationExport(ctx.token, Number(ctx.selectedPeriodId), {
      class_id: ctx.classFilter === "all" ? "all" : Number(ctx.classFilter),
    });
    ctx.setMessage("Export rekap penilaian diproses.");
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal export penilaian.");
  } finally {
    ctx.setIsSaving(false);
  }
}

export async function submitSaveScores(
  event: FormEvent<HTMLFormElement>,
  ctx: {
    token: string;
    selectedPeriodId: string;
    filteredStudents: Student[];
    activeAspects: EvaluationAspect[];
    draftScores: Record<string, string>;
    draftNotes: Record<number, string>;
    setIsSaving: (saving: boolean) => void;
    setError: (err: string) => void;
    setMessage: (msg: string) => void;
    loadScores: (token: string, periodId: string) => Promise<void>;
  }
) {
  event.preventDefault();
  if (!ctx.selectedPeriodId) return;

  const payloadScores = ctx.filteredStudents.flatMap((student) =>
    ctx.activeAspects
      .map((aspect) => {
        const value = ctx.draftScores[`${student.id}:${aspect.id}`];
        if (!value) return null;

        return {
          student_id: student.id,
          evaluation_aspect_id: aspect.id,
          class_id: student.primary_class_id || null,
          score: Number(value),
          notes: ctx.draftNotes[student.id] || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  );

  if (!payloadScores.length) {
    ctx.setError("Isi minimal satu nilai sebelum menyimpan.");
    return;
  }

  ctx.setIsSaving(true);
  ctx.setError("");
  ctx.setMessage("");

  try {
    await upsertAkademiEvaluationScores(ctx.token, Number(ctx.selectedPeriodId), {
      scores: payloadScores,
    });
    await ctx.loadScores(ctx.token, ctx.selectedPeriodId);
    ctx.setMessage("Nilai penilaian tersimpan.");
  } catch (caught) {
    ctx.setError(caught instanceof Error ? caught.message : "Gagal menyimpan nilai.");
  } finally {
    ctx.setIsSaving(false);
  }
}
