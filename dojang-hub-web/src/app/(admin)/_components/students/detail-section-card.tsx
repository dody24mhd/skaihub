import { ReactNode } from "react";

export default function DetailSectionCard({
  title,
  action,
  isLoading = false,
  error = "",
  onRetry,
  children,
}: {
  title: string;
  action?: ReactNode;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <article className="card-soft min-w-0 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-primary">{title}</h2>
        {action}
      </div>
      {isLoading ? <p className="py-4 text-sm text-muted">Memuat {title.toLowerCase()}...</p> : null}
      {!isLoading && error ? (
        <div className="mt-4 flex flex-col gap-2 border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary">
          <p>{error}</p>
          {onRetry ? (
            <button className="min-h-11 w-fit border border-secondary/30 bg-white px-4 text-xs font-bold" onClick={onRetry} type="button">
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}
      {!isLoading && !error ? children : null}
    </article>
  );
}
