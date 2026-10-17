"use client";

export default function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-6 text-sm font-semibold text-white transition hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
    >
      Coba lagi
    </button>
  );
}
