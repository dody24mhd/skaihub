import type { Metadata } from "next";
import AdminLoginForm from "../_components/admin-login-form";

export const metadata: Metadata = {
  title: "Login SKAIHUB",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface text-primary lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="label-caps mb-3 text-secondary">SKAIHUB App</p>
          <h1 className="font-heading text-3xl font-black text-primary">
            Masuk ke dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Satu pintu login untuk internal SKAIHUB dan operasional akademi.
          </p>
          <div className="card-soft mt-8 rounded-lg bg-white p-6">
            <AdminLoginForm />
          </div>
        </div>
      </section>

      <aside className="hidden min-h-screen bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-white text-primary">
            <span className="material-symbols-outlined text-[28px]">sports_martial_arts</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/65">SKAIHUB</p>
            <p className="font-heading text-xl font-bold">Academy OS</p>
          </div>
        </div>
        <div>
          <p className="max-w-xl font-heading text-4xl font-black leading-tight">
            Operasional akademi dan kontrol internal dalam satu platform.
          </p>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/72">
            Internal SKAIHUB masuk ke area internal. Ketua, pengurus akademi, dan pelatih masuk ke area akademi masing-masing.
          </p>
        </div>
      </aside>
    </main>
  );
}
