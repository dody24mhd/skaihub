import Link from "next/link";
import { Student } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { ResponsiveColumn } from "../ui";
import { studentStatusLabels, studentStatusStyles } from "./student-status";

const actionClass =
  "inline-flex min-h-11 items-center justify-center border border-border bg-white px-3 text-xs font-bold text-primary transition hover:border-primary hover:bg-surface-container-low";

export function buildStudentColumns({
  canManage,
  onDelete,
}: {
  canManage: boolean;
  onDelete: (item: Student) => void;
}): ResponsiveColumn<Student>[] {
  return [
    {
      key: "photo",
      header: "Foto",
      hideOnMobile: true,
      render: (item) =>
        item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt="" className="size-10 object-cover" />
        ) : (
          <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
        ),
    },
    {
      key: "name",
      header: "Nama Siswa",
      primary: true,
      render: (item) => (
        <span className="block min-w-0 break-words font-bold text-primary">
          {item.name}
          <span className="block text-xs font-medium text-muted">{item.member_number}</span>
        </span>
      ),
    },
    {
      key: "class",
      header: "Kelas",
      render: (item) => <span className="text-muted">{item.primary_class?.name || "-"}</span>,
    },
    {
      key: "rank",
      header: "Tingkatan",
      render: (item) => (
        <div className="flex flex-col items-end gap-1 md:items-start">
          <AcademyRankBeltBadge rank={item.current_rank} size="sm" showLabel={false} />
          <span className="text-xs font-semibold text-muted">{item.current_rank?.label || "Belum ada tingkatan"}</span>
        </div>
      ),
    },
    {
      key: "physic",
      header: "Fisik",
      hideOnMobile: true,
      render: (item) => <span className="text-muted">{item.height_cm} cm / {Number(item.weight_kg)} kg</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span className={`inline-flex px-2 py-1 text-xs font-bold ${studentStatusStyles[item.status]}`}>
          {studentStatusLabels[item.status]}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap">
          <Link className={actionClass} href={`/academy/students/${item.id}`}>Detail</Link>
          {canManage ? <Link className={actionClass} href={`/academy/students/${item.id}/edit`}>Edit</Link> : null}
          {canManage ? (
            <button
              className="inline-flex min-h-11 items-center justify-center border border-secondary/30 bg-white px-3 text-xs font-bold text-secondary transition hover:bg-secondary/10"
              onClick={() => onDelete(item)}
              type="button"
            >
              Hapus
            </button>
          ) : null}
        </div>
      ),
    },
  ];
}
