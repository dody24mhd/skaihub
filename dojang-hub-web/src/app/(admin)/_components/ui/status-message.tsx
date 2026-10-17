import { ReactNode } from "react";

export type StatusTone = "success" | "error" | "info";

export type StatusMessageProps = {
  tone: StatusTone;
  message?: string | null;
  className?: string;
  children?: ReactNode;
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/5 text-success-strong",
  error: "border-secondary/30 bg-secondary/5 text-secondary",
  info: "border-primary/20 bg-primary/5 text-primary",
};

/**
 * Live region selalu ter-mount (disembunyikan secara visual saat kosong) agar
 * pembaca layar mengumumkan pesan yang muncul belakangan.
 */
export default function StatusMessage({ tone, message, className = "", children }: StatusMessageProps) {
  const role = tone === "error" ? "alert" : "status";

  if (!message) {
    return <div role={role} className="sr-only" />;
  }

  return (
    <div role={role} className={`border p-3 text-sm font-semibold ${TONE_CLASSES[tone]} ${className}`.trim()}>
      {message}
      {children}
    </div>
  );
}
