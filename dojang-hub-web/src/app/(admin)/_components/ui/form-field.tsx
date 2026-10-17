import React, { InputHTMLAttributes, ReactNode } from "react";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
}

export default function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className = "",
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-primary"
      >
        {label}
        {required ? <span className="ml-1 text-secondary">*</span> : null}
      </label>

      {children ? (
        children
      ) : (
        <input
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`min-h-11 w-full border bg-white px-3.5 py-2.5 text-base text-primary placeholder:text-muted/60 transition focus:outline-hidden focus:ring-2 sm:text-sm ${
            error
              ? "border-secondary focus:border-secondary focus:ring-secondary"
              : "border-border-strong focus:border-primary focus:ring-primary"
          }`}
          {...inputProps}
        />
      )}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-semibold text-secondary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
