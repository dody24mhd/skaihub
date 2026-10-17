import { EvaluationAspect } from "../../_lib/admin-api";
import { ResponsiveColumn } from "../ui";

type AspectColumnOptions = {
  isSaving: boolean;
  onEdit: (aspect: EvaluationAspect) => void;
  onDelete: (aspect: EvaluationAspect) => void;
};

export function buildAspectColumns({ isSaving, onEdit, onDelete }: AspectColumnOptions): ResponsiveColumn<EvaluationAspect>[] {
  return [
    {
      key: "name",
      header: "Variabel",
      primary: true,
      render: (a) => (
        <div>
          <p className="font-bold text-primary">{a.name}</p>
          <p className="text-xs text-muted">{a.category || "Tanpa kategori"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
            a.is_active ? "bg-success/10 text-success-strong" : "bg-muted/10 text-muted"
          }`}
        >
          {a.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (a) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-bold text-primary transition hover:border-primary disabled:bg-muted"
            disabled={isSaving}
            onClick={() => onEdit(a)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/30 px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10 disabled:bg-muted"
            disabled={isSaving}
            onClick={() => onDelete(a)}
            type="button"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];
}
