import type { Metadata } from "next";
import ReloadButton from "./reload-button";

export const metadata: Metadata = {
  title: "Anda Sedang Offline | SKAIHUB",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12 text-center text-foreground">
      <div className="card-soft w-full max-w-md rounded-lg p-8">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-1.414-1.414m-2.829-2.829a9 9 0 010-12.728m2.829 2.829A5 5 0 018.464 8.464M3 3l18 18"
            />
          </svg>
        </div>

        <h1 className="mb-2 font-heading text-2xl font-bold text-primary">
          Anda sedang offline
        </h1>

        <p className="mb-6 text-sm text-muted">
          Koneksi internet Anda terputus. Pastikan perangkat Anda terhubung ke jaringan internet untuk melanjutkan penggunaan aplikasi SKAIHUB.
        </p>

        <div className="flex flex-col gap-3">
          <ReloadButton />
        </div>
      </div>
    </main>
  );
}
