"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AcademyPublicProfile,
  PublicProfileCoach,
  getAkademiMe,
  getAkademiPublicProfile,
  updateAkademiCoachVisibility,
  updateAkademiPublicProfile,
} from "../_lib/admin-api";
import {
  ProfileAchievementsSection,
  ProfileAppearanceSection,
  ProfileCoachesSection,
  ProfileGallerySection,
  ProfileHeroSection,
  ProfileInfoSection,
  ProfileOfficialsSection,
} from "./setup/public-profile";
import { PageHeader } from "./ui";

const TOKEN_KEY = "skaihub_admin_token";

function getToken(): string {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) ?? "" : "";
}

type Tab = "profil" | "tampilan" | "pelatih" | "pengurus" | "galeri" | "prestasi";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "profil", label: "Info & Publish", icon: "info" },
  { key: "tampilan", label: "Tampilan", icon: "palette" },
  { key: "pelatih", label: "Pelatih", icon: "sports_martial_arts" },
  { key: "pengurus", label: "Pengurus", icon: "groups" },
  { key: "galeri", label: "Hero & Galeri", icon: "photo_library" },
  { key: "prestasi", label: "Prestasi", icon: "emoji_events" },
];

export default function AcademyPublicProfileManager() {
  const [tab, setTab] = useState<Tab>("profil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<AcademyPublicProfile | null>(null);
  const [coaches, setCoaches] = useState<PublicProfileCoach[]>([]);
  const [hasPublicWebsite, setHasPublicWebsite] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const [data, me] = await Promise.all([
        getAkademiPublicProfile(token),
        getAkademiMe(token),
      ]);
      const canPublish = me.entitlements.has_public_website;
      setHasPublicWebsite(canPublish);
      setProfile(data.profile);
      setCoaches(data.coaches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data profil publik.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  function notify(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleSaveProfileInfo(payload: {
    about: string;
    vision: string;
    mission: string;
    whatsapp: string;
    cta_label: string;
    is_published: boolean;
  }) {
    setSaving(true);
    setError(null);
    try {
      const result = await updateAkademiPublicProfile(getToken(), {
        about: payload.about || null,
        vision: payload.vision || null,
        mission: payload.mission || null,
        whatsapp: payload.whatsapp || null,
        cta_label: payload.cta_label || null,
        is_published: hasPublicWebsite ? payload.is_published : false,
      });
      setProfile(result.profile);
      notify("Informasi profil publik berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan informasi profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAppearance(payload: {
    primary_color: string;
    button_color: string;
    background_color: string;
    text_color: string;
    heading_font: string;
    body_font: string;
    button_radius: number;
  }) {
    setSaving(true);
    setError(null);
    try {
      const result = await updateAkademiPublicProfile(getToken(), {
        primary_color: payload.primary_color,
        button_color: payload.button_color,
        background_color: payload.background_color,
        text_color: payload.text_color,
        heading_font: payload.heading_font,
        body_font: payload.body_font,
        button_radius: payload.button_radius,
      });
      setProfile(result.profile);
      notify("Tema dan tampilan publik berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan tema tampilan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCoach(coach: PublicProfileCoach) {
    try {
      await updateAkademiCoachVisibility(getToken(), coach.id, !coach.show_on_public);
      setCoaches((prev) =>
        prev.map((c) => (c.id === coach.id ? { ...c, show_on_public: !c.show_on_public } : c)),
      );
      notify("Visibilitas pelatih diperbarui.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah visibilitas pelatih.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-secondary">refresh</span>
        <span className="ml-2 text-sm text-muted">Memuat profil publik...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Website Akademi"
        title="Profil Publik"
        description="Kelola informasi, tampilan warna, slider hero, pengurus, dan galeri untuk website publik akademi Anda."
      />

      {error ? (
        <div className="border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm font-semibold text-secondary">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="border border-success/20 bg-success/5 px-4 py-3 text-sm font-semibold text-success">
          {success}
        </div>
      ) : null}

      {/* Tab navigation yang ramah mobile (bisa scroll horizontal jika layar sempit) */}
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              tab === t.key
                ? "border-secondary text-secondary"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "profil" && (
        <ProfileInfoSection
          profile={profile}
          hasPublicWebsite={hasPublicWebsite}
          onSave={handleSaveProfileInfo}
          saving={saving}
        />
      )}

      {tab === "tampilan" && (
        <ProfileAppearanceSection
          profile={profile}
          onSave={handleSaveAppearance}
          saving={saving}
        />
      )}

      {tab === "pelatih" && (
        <ProfileCoachesSection coaches={coaches} onToggleCoach={handleToggleCoach} />
      )}

      {tab === "pengurus" && (
        <ProfileOfficialsSection
          officials={profile?.officials ?? []}
          token={getToken()}
          onRefresh={loadData}
          onNotify={notify}
          onError={(msg) => setError(msg)}
        />
      )}

      {tab === "galeri" && (
        <div className="space-y-8">
          <ProfileHeroSection
            heroImages={profile?.hero_images ?? []}
            token={getToken()}
            buttonColor={profile?.button_color ?? "#d32f2f"}
            onRefresh={loadData}
            onNotify={notify}
            onError={(msg) => setError(msg)}
          />
          <ProfileGallerySection
            galleryItems={profile?.gallery_items ?? []}
            token={getToken()}
            onRefresh={loadData}
            onNotify={notify}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {tab === "prestasi" && (
        <ProfileAchievementsSection
          achievements={profile?.achievements ?? []}
          token={getToken()}
          onRefresh={loadData}
          onNotify={notify}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}
