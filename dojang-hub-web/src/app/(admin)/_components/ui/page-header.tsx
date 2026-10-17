import React, { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  eyebrow,
  description,
  action,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 bg-secondary" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary">
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-primary sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
        {children}
      </div>

      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&>a]:flex [&>a]:w-full [&>a]:items-center [&>a]:justify-center sm:[&>a]:w-auto [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:justify-center sm:[&>button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
