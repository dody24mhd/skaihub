import Icon from "../ui/icon";

const pageButtonClass =
  "inline-flex min-h-11 items-center gap-1 border border-border bg-white px-3 text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-45";

export default function ListPagination({
  summary,
  currentPage,
  lastPage,
  isDisabled,
  onPrev,
  onNext,
}: {
  summary: string;
  currentPage: number;
  lastPage: number;
  isDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>{summary}</p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button type="button" onClick={onPrev} disabled={currentPage <= 1 || isDisabled} className={pageButtonClass}>
          <Icon name="chevron_left" className="text-[17px]" />
          Sebelumnya
        </button>
        <span className="min-w-24 text-center text-xs font-bold text-primary">
          Halaman {currentPage} / {lastPage || 1}
        </span>
        <button type="button" onClick={onNext} disabled={currentPage >= lastPage || isDisabled} className={pageButtonClass}>
          Berikutnya
          <Icon name="chevron_right" className="text-[17px]" />
        </button>
      </div>
    </div>
  );
}
