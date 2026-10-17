"use client";

import { useState } from "react";
import { AcademyPublicProfile } from "../../../_lib/admin-api";
import Icon from "../../ui/icon";

const fontOptions = ["Inter", "Montserrat", "Poppins", "Roboto", "Lato", "Open Sans"];

type ProfileAppearanceSectionProps = {
  profile: AcademyPublicProfile | null;
  onSave: (payload: {
    primary_color: string;
    button_color: string;
    background_color: string;
    text_color: string;
    heading_font: string;
    body_font: string;
    button_radius: number;
  }) => Promise<void>;
  saving: boolean;
};

export default function ProfileAppearanceSection({
  profile,
  onSave,
  saving,
}: ProfileAppearanceSectionProps) {
  const [primaryColor, setPrimaryColor] = useState(profile?.primary_color ?? "#031636");
  const [buttonColor, setButtonColor] = useState(profile?.button_color ?? "#d32f2f");
  const [backgroundColor, setBackgroundColor] = useState(profile?.background_color ?? "#f8fafc");
  const [textColor, setTextColor] = useState(profile?.text_color ?? "#0f172a");
  const [headingFont, setHeadingFont] = useState(profile?.heading_font ?? "Montserrat");
  const [bodyFont, setBodyFont] = useState(profile?.body_font ?? "Inter");
  const [buttonRadius, setButtonRadius] = useState(profile?.button_radius ?? 8);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      primary_color: primaryColor,
      button_color: buttonColor,
      background_color: backgroundColor,
      text_color: textColor,
      heading_font: headingFont,
      body_font: bodyFont,
      button_radius: buttonRadius,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <div className="border border-border bg-white p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">Palet Warna</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "color-primary", label: "Warna Utama", value: primaryColor, setter: setPrimaryColor },
              { id: "color-button", label: "Warna Tombol / Aksen", value: buttonColor, setter: setButtonColor },
              { id: "color-bg", label: "Warna Background", value: backgroundColor, setter: setBackgroundColor },
              { id: "color-text", label: "Warna Teks", value: textColor, setter: setTextColor },
            ].map(({ id, label, value, setter }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-primary">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={id}
                    type="color"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="size-11 shrink-0 cursor-pointer border border-border bg-white p-1"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="min-h-11 flex-1 border border-border bg-white px-3.5 py-2.5 text-base text-primary font-mono sm:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-white p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">Tipografi & Gaya</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="font-heading" className="text-xs font-bold uppercase tracking-wide text-primary">
                Font Heading
              </label>
              <select
                id="font-heading"
                className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary sm:text-sm"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="font-body" className="text-xs font-bold uppercase tracking-wide text-primary">
                Font Body
              </label>
              <select
                id="font-body"
                className="min-h-11 w-full border border-border bg-white px-3.5 py-2.5 text-base text-primary sm:text-sm"
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="button-radius" className="text-xs font-bold uppercase tracking-wide text-primary">
                  Sudut Tombol (Radius)
                </label>
                <span className="text-xs font-bold text-secondary">{buttonRadius}px</span>
              </div>
              <input
                id="button-radius"
                type="range"
                min={0}
                max={32}
                value={buttonRadius}
                onChange={(e) => setButtonRadius(Number(e.target.value))}
                className="mt-2 h-2 w-full accent-secondary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-secondary px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-secondary-dark disabled:bg-muted focus:outline-hidden focus:ring-2 focus:ring-secondary sm:w-auto"
        >
          {saving && <Icon name="refresh" className="animate-spin text-[18px]" />}
          {saving ? "Menyimpan..." : "Simpan Tampilan"}
        </button>
      </div>

      <div className="border border-border bg-white p-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Live Preview</h3>
        <div
          className="border border-border p-5 transition-all"
          style={{ backgroundColor, color: textColor, fontFamily: bodyFont }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6" style={{ backgroundColor: buttonColor }} />
            <span
              className="text-[11px] font-black uppercase tracking-[0.15em]"
              style={{ color: buttonColor }}
            >
              Taekwondo Dojang
            </span>
          </div>
          <h4
            className="text-2xl font-black uppercase tracking-tight"
            style={{ color: primaryColor, fontFamily: headingFont }}
          >
            Nama Akademi Anda
          </h4>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: textColor }}>
            Mencetak atlet disiplin, berprestasi, dan berintegritas tinggi sejak usia dini.
          </p>
          <div className="mt-5">
            <button
              type="button"
              className="min-h-11 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-xs"
              style={{ backgroundColor: buttonColor, borderRadius: `${buttonRadius}px` }}
            >
              {profile?.cta_label || "Hubungi via WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
