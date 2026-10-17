"use client";

import { useState } from "react";
import { AcademyPublicProfile } from "../../../_lib/admin-api";
import { FormField } from "../../ui";
import Icon from "../../ui/icon";

type ProfileInfoSectionProps = {
  profile: AcademyPublicProfile | null;
  hasPublicWebsite: boolean;
  onSave: (payload: {
    about: string;
    vision: string;
    mission: string;
    whatsapp: string;
    cta_label: string;
    is_published: boolean;
  }) => Promise<void>;
  saving: boolean;
};

export default function ProfileInfoSection({
  profile,
  hasPublicWebsite,
  onSave,
  saving,
}: ProfileInfoSectionProps) {
  const [about, setAbout] = useState(profile?.about ?? "");
  const [vision, setVision] = useState(profile?.vision ?? "");
  const [mission, setMission] = useState(profile?.mission ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [ctaLabel, setCtaLabel] = useState(profile?.cta_label ?? "Hubungi via WhatsApp");
  const [isPublished, setIsPublished] = useState(
    hasPublicWebsite ? (profile?.is_published ?? false) : false,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      about,
      vision,
      mission,
      whatsapp,
      cta_label: ctaLabel,
      is_published: hasPublicWebsite ? isPublished : false,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="border border-border bg-white p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
            Status Halaman Publik
          </h3>
          <label
            className={`flex items-center gap-3 ${
              hasPublicWebsite ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div
              className={`relative h-6 w-11 rounded-full transition ${
                isPublished ? "bg-secondary" : "bg-border"
              }`}
              onClick={() => {
                if (hasPublicWebsite) setIsPublished((v) => !v);
              }}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-all ${
                  isPublished ? "left-5" : "left-0.5"
                }`}
              />
            </div>
            <span className="text-sm font-semibold text-primary">
              {isPublished ? "Dipublikasikan" : "Disembunyikan"}
            </span>
          </label>
          <p className="mt-2 text-xs text-muted">
            {hasPublicWebsite
              ? "Aktifkan agar halaman publik akademi Anda dapat diakses secara online oleh calon siswa dan orang tua."
              : "Fitur halaman publik tersedia khusus untuk paket langganan Pro atau Scale."}
          </p>
        </div>

        <div className="space-y-4 border border-border bg-white p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Kontak & CTA</h3>
          <div>
            <label htmlFor="info-whatsapp" className="mb-1 block text-xs font-bold uppercase tracking-wide text-primary">
              Nomor WhatsApp
            </label>
            <div className="flex items-center gap-2">
              <span className="flex min-h-11 items-center border border-border bg-surface px-3 text-sm font-bold text-muted">
                +62
              </span>
              <input
                id="info-whatsapp"
                type="tel"
                inputMode="numeric"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                placeholder="81234567890"
                className="min-h-11 min-w-0 flex-1 border border-border bg-white px-3.5 py-2.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-muted">Tanpa awalan 0 atau 62. Contoh: 81234567890</p>
          </div>

          <FormField
            id="info-cta"
            label="Teks Tombol Aksi (CTA)"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Hubungi via WhatsApp"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
        >
          {saving && <Icon name="refresh" className="animate-spin text-[18px]" />}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="space-y-4 border border-border bg-white p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Informasi Akademi</h3>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="info-about" className="text-xs font-bold uppercase tracking-wide text-primary">
            Deskripsi Akademi
          </label>
          <textarea
            id="info-about"
            rows={5}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Ceritakan profil, sejarah singkat, dan filosofi akademi kepada calon siswa..."
            className="w-full border border-border bg-white p-3.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="info-vision" className="text-xs font-bold uppercase tracking-wide text-primary">
            Visi
          </label>
          <textarea
            id="info-vision"
            rows={3}
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Visi akademi ke depan..."
            className="w-full border border-border bg-white p-3.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="info-mission" className="text-xs font-bold uppercase tracking-wide text-primary">
            Misi
          </label>
          <textarea
            id="info-mission"
            rows={4}
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Tulis poin-poin misi pembinaan akademi..."
            className="w-full border border-border bg-white p-3.5 text-base text-primary placeholder:text-muted/60 transition focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary sm:text-sm"
          />
        </div>
      </div>
    </form>
  );
}
