import { Student, TrainingClass } from "../../_lib/admin-api";

export type StudentStatusFilter = "all" | Student["status"];

const controlClass =
  "min-h-11 w-full border border-border bg-white px-3 text-base text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary sm:text-sm";

export default function StudentListToolbar({
  query,
  statusFilter,
  classFilter,
  classes,
  onQueryChange,
  onStatusChange,
  onClassChange,
}: {
  query: string;
  statusFilter: StudentStatusFilter;
  classFilter: string;
  classes: TrainingClass[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StudentStatusFilter) => void;
  onClassChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <label className="col-span-2 md:col-span-1">
        <span className="sr-only">Cari siswa</span>
        <input
          className={controlClass}
          type="search"
          placeholder="Cari siswa"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <label>
        <span className="sr-only">Filter status</span>
        <select
          className={controlClass}
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as StudentStatusFilter)}
        >
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="alumni">Alumni</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Filter kelas</span>
        <select className={controlClass} value={classFilter} onChange={(event) => onClassChange(event.target.value)}>
          <option value="all">Semua kelas</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
    </div>
  );
}
