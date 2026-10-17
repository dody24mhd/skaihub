/* eslint-disable @next/next/no-img-element */
"use client";

import { PublicProfileCoach } from "../../../_lib/admin-api";

type ProfileCoachesSectionProps = {
  coaches: PublicProfileCoach[];
  onToggleCoach: (coach: PublicProfileCoach) => Promise<void>;
};

export default function ProfileCoachesSection({
  coaches,
  onToggleCoach,
}: ProfileCoachesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border border-border bg-white p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          Visibilitas Pelatih Publik
        </h3>
        <p className="mt-1 text-sm text-muted">
          Pilih profil pelatih yang akan ditampilkan pada section Pelatih & Instruktur di halaman publik.
        </p>

        {coaches.length === 0 ? (
          <div className="mt-4 border-2 border-dashed border-border p-8 text-center text-sm font-medium text-muted">
            Belum ada pelatih terdaftar. Tambahkan akun pelatih di menu Akun Akademi.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border border border-border">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {coach.photo_url ? (
                    <img
                      src={coach.photo_url}
                      alt={coach.name}
                      className="size-11 shrink-0 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border">
                      <span className="material-symbols-outlined text-[20px] text-muted">person</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-primary">{coach.name}</p>
                    <p className="text-xs text-muted">
                      {coach.rank_label || "Tingkatan sabuk belum diisi"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs font-semibold text-muted">
                    {coach.show_on_public ? "Ditampilkan di website" : "Disembunyikan"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCoach(coach)}
                    aria-label={`Ubah status tampilkan ${coach.name}`}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-secondary/20 ${
                      coach.show_on_public ? "bg-secondary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 transform rounded-full bg-white shadow-xs transition-transform ${
                        coach.show_on_public ? "translate-x-5" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
