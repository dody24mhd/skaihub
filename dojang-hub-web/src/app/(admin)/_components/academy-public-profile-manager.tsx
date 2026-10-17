"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AcademyPublicProfile,
  type GalleryItem,
  type HeroImage,
  type PublicAchievement,
  type PublicOfficial,
  type PublicProfileCoach,
  addAkademiHeroImage,
  addAkademiGalleryItem,
  addAkademiPublicOfficial,
  deleteAkademiHeroImage,
  addAkademiPublicAchievement,
  deleteAkademiGalleryItem,
  deleteAkademiPublicOfficial,
  deleteAkademiPublicAchievement,
  getAkademiMe,
  getAkademiPublicProfile,
  updateAkademiGalleryItem,
  updateAkademiHeroImage,
  updateAkademiCoachVisibility,
  updateAkademiPublicOfficial,
  updateAkademiPublicAchievement,
  updateAkademiPublicProfile,
  uploadAkademiFile,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

function getToken(): string {
  return typeof window !== "undefined" ? (localStorage.getItem(TOKEN_KEY) ?? "") : "";
}

type Tab = "profil" | "tampilan" | "pelatih" | "pengurus" | "galeri" | "prestasi";

const fontOptions = ["Inter", "Montserrat", "Poppins", "Roboto", "Lato", "Open Sans"];

export default function AcademyPublicProfileManager() {
  const [tab, setTab] = useState<Tab>("profil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<AcademyPublicProfile | null>(null);
  const [coaches, setCoaches] = useState<PublicProfileCoach[]>([]);
  const [hasPublicWebsite, setHasPublicWebsite] = useState(false);

  const [about, setAbout] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Hubungi via WhatsApp");
  const [isPublished, setIsPublished] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#031636");
  const [buttonColor, setButtonColor] = useState("#d32f2f");
  const [backgroundColor, setBackgroundColor] = useState("#f8fafc");
  const [textColor, setTextColor] = useState("#0f172a");
  const [headingFont, setHeadingFont] = useState("Montserrat");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [buttonRadius, setButtonRadius] = useState(8);

  const [newAchievement, setNewAchievement] = useState({ title: "", description: "", achieved_on: "" });
  const [editingAchievement, setEditingAchievement] = useState<PublicAchievement | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroImage | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [heroFocalX, setHeroFocalX] = useState(50);
  const [heroFocalY, setHeroFocalY] = useState(50);
  const [heroPanX, setHeroPanX] = useState(0);
  const [heroPanY, setHeroPanY] = useState(0);
  const [heroZoom, setHeroZoom] = useState(100);
  const [heroInitialPanX, setHeroInitialPanX] = useState(0);
  const [heroInitialPanY, setHeroInitialPanY] = useState(0);
  const [heroInitialZoom, setHeroInitialZoom] = useState(100);
  const [heroDragStart, setHeroDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [newOfficial, setNewOfficial] = useState({
    name: "",
    position: "",
    description: "",
    photo_url: "",
  });
  const [newOfficialFile, setNewOfficialFile] = useState<File | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<PublicOfficial | null>(null);
  const [editingOfficialFile, setEditingOfficialFile] = useState<File | null>(null);

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
      if (data.profile) {
        setAbout(data.profile.about ?? "");
        setVision(data.profile.vision ?? "");
        setMission(data.profile.mission ?? "");
        setWhatsapp(data.profile.whatsapp ?? "");
        setCtaLabel(data.profile.cta_label ?? "Hubungi via WhatsApp");
        setIsPublished(canPublish ? data.profile.is_published : false);
        setPrimaryColor(data.profile.primary_color ?? "#031636");
        setButtonColor(data.profile.button_color ?? "#d32f2f");
        setBackgroundColor(data.profile.background_color ?? "#f8fafc");
        setTextColor(data.profile.text_color ?? "#0f172a");
        setHeadingFont(data.profile.heading_font ?? "Montserrat");
        setBodyFont(data.profile.body_font ?? "Inter");
        setButtonRadius(data.profile.button_radius ?? 8);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
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

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    try {
      const result = await updateAkademiPublicProfile(getToken(), {
        about: about || null,
        vision: vision || null,
        mission: mission || null,
        public_schedule: null,
        whatsapp: whatsapp || null,
        cta_label: ctaLabel || null,
        is_published: hasPublicWebsite ? isPublished : false,
        primary_color: primaryColor,
        button_color: buttonColor,
        background_color: backgroundColor,
        text_color: textColor,
        heading_font: headingFont,
        body_font: bodyFont,
        button_radius: buttonRadius,
      });
      setProfile(result.profile);
      notify("Profil berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCoach(coach: PublicProfileCoach) {
    try {
      await updateAkademiCoachVisibility(getToken(), coach.id, !coach.show_on_public);
      setCoaches((prev) =>
        prev.map((c) => (c.id === coach.id ? { ...c, show_on_public: !c.show_on_public } : c))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah visibilitas pelatih.");
    }
  }

  function openHeroModal(item?: HeroImage) {
    setEditingHero(item ?? null);
    setHeroFile(null);
    setHeroCaption(item?.caption ?? "");
    setHeroFocalX(item?.focal_x ?? 50);
    setHeroFocalY(item?.focal_y ?? 50);
    setHeroPanX(item?.pan_x ?? 0);
    setHeroPanY(item?.pan_y ?? 0);
    setHeroZoom(item?.zoom ?? 100);
    setHeroInitialPanX(item?.pan_x ?? 0);
    setHeroInitialPanY(item?.pan_y ?? 0);
    setHeroInitialZoom(item?.zoom ?? 100);
    setHeroPreviewUrl(item?.image_url ?? "");
    setShowHeroModal(true);
  }

  function closeHeroModal() {
    if (heroPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(heroPreviewUrl);
    setShowHeroModal(false);
    setEditingHero(null);
    setHeroFile(null);
    setHeroPreviewUrl("");
    setHeroCaption("");
    setHeroFocalX(50);
    setHeroFocalY(50);
    setHeroPanX(0);
    setHeroPanY(0);
    setHeroZoom(100);
    setHeroInitialPanX(0);
    setHeroInitialPanY(0);
    setHeroInitialZoom(100);
    setHeroDragStart(null);
  }

  function handleHeroFileChange(file: File | null) {
    if (heroPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(heroPreviewUrl);
    setHeroFile(file);
    setHeroPreviewUrl(file ? URL.createObjectURL(file) : "");
    setHeroPanX(0);
    setHeroPanY(0);
    setHeroZoom(100);
    setHeroInitialPanX(0);
    setHeroInitialPanY(0);
    setHeroInitialZoom(100);
  }

  function startHeroDrag(e: React.PointerEvent<HTMLElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setHeroDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      panX: heroPanX,
      panY: heroPanY,
    });
  }

  function moveHeroDrag(e: React.PointerEvent<HTMLElement>) {
    if (!heroDragStart || e.buttons !== 1) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const deltaX = ((e.clientX - heroDragStart.pointerX) / rect.width) * 80;
    const deltaY = ((e.clientY - heroDragStart.pointerY) / rect.height) * 80;

    setHeroPanX(Math.max(-100, Math.min(100, Math.round(heroDragStart.panX + deltaX))));
    setHeroPanY(Math.max(-100, Math.min(100, Math.round(heroDragStart.panY + deltaY))));
  }

  async function handleSaveHeroImage() {
    if (!editingHero && !heroFile) return;

    setUploadingHero(true);
    setError(null);
    try {
      if (editingHero) {
        const result = await updateAkademiHeroImage(getToken(), editingHero.id, {
          caption: heroCaption.trim() || null,
          focal_x: heroFocalX,
          focal_y: heroFocalY,
          pan_x: heroPanX,
          pan_y: heroPanY,
          zoom: heroZoom,
        });
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hero_images: (prev.hero_images ?? []).map((item) =>
              item.id === result.item.id ? result.item : item
            ),
          };
        });
        notify("Hero image diperbarui.");
      } else {
        const uploaded = await uploadAkademiFile(getToken(), heroFile as File, "session_photo");
        const result = await addAkademiHeroImage(getToken(), {
          image_url: uploaded.url,
          caption: heroCaption.trim() || null,
          focal_x: heroFocalX,
          focal_y: heroFocalY,
          pan_x: heroPanX,
          pan_y: heroPanY,
          zoom: heroZoom,
          sort_order: profile?.hero_images?.length ?? 0,
          is_active: true,
        });
        setProfile((prev) => {
          if (!prev) return prev;
          return { ...prev, hero_images: [...(prev.hero_images ?? []), result.item] };
        });
        notify("Gambar hero ditambahkan.");
      }
      closeHeroModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan hero image.");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleToggleHero(item: HeroImage) {
    try {
      const result = await updateAkademiHeroImage(getToken(), item.id, {
        is_active: !item.is_active,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hero_images: (prev.hero_images ?? []).map((hero) =>
            hero.id === item.id ? result.item : hero
          ),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status hero.");
    }
  }

  async function handleDeleteHero(item: HeroImage) {
    if (!confirm("Hapus gambar hero ini?")) return;
    try {
      await deleteAkademiHeroImage(getToken(), item.id);
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, hero_images: (prev.hero_images ?? []).filter((hero) => hero.id !== item.id) };
      });
      notify("Gambar hero dihapus.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus gambar hero.");
    }
  }

  async function handleGalleryUpload() {
    if (!galleryFile) return;

    setUploadingGallery(true);
    setError(null);
    try {
      const uploaded = await uploadAkademiFile(getToken(), galleryFile, "session_photo");
      const result = await addAkademiGalleryItem(getToken(), {
        image_url: uploaded.url,
        caption: galleryCaption.trim() || null,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, gallery_items: [...prev.gallery_items, result.item] };
      });
      setShowGalleryModal(false);
      setGalleryFile(null);
      setGalleryCaption("");
      notify("Foto berhasil ditambahkan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleToggleAboutGallery(item: GalleryItem) {
    try {
      const result = await updateAkademiGalleryItem(getToken(), item.id, {
        show_on_about: !item.show_on_about,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gallery_items: prev.gallery_items.map((gallery) =>
            gallery.id === item.id ? result.item : gallery
          ),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah foto About Us.");
    }
  }

  async function handleDeleteGallery(item: GalleryItem) {
    if (!confirm("Hapus foto ini?")) return;
    try {
      await deleteAkademiGalleryItem(getToken(), item.id);
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, gallery_items: prev.gallery_items.filter((g) => g.id !== item.id) };
      });
      notify("Foto dihapus.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus foto.");
    }
  }

  async function handleAddAchievement() {
    if (!newAchievement.title.trim()) return;
    setSaving(true);
    try {
      const result = await addAkademiPublicAchievement(getToken(), {
        title: newAchievement.title,
        description: newAchievement.description || null,
        achieved_on: newAchievement.achieved_on || null,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, achievements: [...prev.achievements, result.achievement] };
      });
      setNewAchievement({ title: "", description: "", achieved_on: "" });
      notify("Prestasi ditambahkan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambahkan prestasi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAchievement() {
    if (!editingAchievement) return;
    setSaving(true);
    try {
      const result = await updateAkademiPublicAchievement(getToken(), editingAchievement.id, {
        title: editingAchievement.title,
        description: editingAchievement.description,
        achieved_on: editingAchievement.achieved_on,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          achievements: prev.achievements.map((a) =>
            a.id === result.achievement.id ? result.achievement : a
          ),
        };
      });
      setEditingAchievement(null);
      notify("Prestasi diperbarui.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui prestasi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAchievement(achievement: PublicAchievement) {
    if (!confirm(`Hapus prestasi "${achievement.title}"?`)) return;
    try {
      await deleteAkademiPublicAchievement(getToken(), achievement.id);
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, achievements: prev.achievements.filter((a) => a.id !== achievement.id) };
      });
      notify("Prestasi dihapus.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus prestasi.");
    }
  }

  async function handleAddOfficial() {
    if (!newOfficial.name.trim() || !newOfficial.position.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let photoUrl = newOfficial.photo_url.trim() || null;
      if (newOfficialFile) {
        const uploaded = await uploadAkademiFile(getToken(), newOfficialFile, "session_photo");
        photoUrl = uploaded.url;
      }

      const result = await addAkademiPublicOfficial(getToken(), {
        name: newOfficial.name.trim(),
        position: newOfficial.position.trim(),
        description: newOfficial.description.trim() || null,
        photo_url: photoUrl,
        sort_order: profile?.officials?.length ?? 0,
        is_active: true,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, officials: [...(prev.officials ?? []), result.official] };
      });
      setNewOfficial({ name: "", position: "", description: "", photo_url: "" });
      setNewOfficialFile(null);
      notify("Pengurus ditambahkan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambahkan pengurus.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateOfficial() {
    if (!editingOfficial) return;
    setSaving(true);
    setError(null);
    try {
      let photoUrl = editingOfficial.photo_url;
      if (editingOfficialFile) {
        const uploaded = await uploadAkademiFile(getToken(), editingOfficialFile, "session_photo");
        photoUrl = uploaded.url;
      }

      const result = await updateAkademiPublicOfficial(getToken(), editingOfficial.id, {
        name: editingOfficial.name,
        position: editingOfficial.position,
        description: editingOfficial.description,
        photo_url: photoUrl,
        is_active: editingOfficial.is_active,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          officials: (prev.officials ?? []).map((item) =>
            item.id === result.official.id ? result.official : item
          ),
        };
      });
      setEditingOfficial(null);
      setEditingOfficialFile(null);
      notify("Pengurus diperbarui.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui pengurus.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOfficial(official: PublicOfficial) {
    if (!confirm(`Hapus pengurus "${official.name}"?`)) return;
    try {
      await deleteAkademiPublicOfficial(getToken(), official.id);
      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, officials: (prev.officials ?? []).filter((item) => item.id !== official.id) };
      });
      notify("Pengurus dihapus.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus pengurus.");
    }
  }

  async function handleToggleOfficial(official: PublicOfficial) {
    try {
      const result = await updateAkademiPublicOfficial(getToken(), official.id, {
        is_active: !official.is_active,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          officials: (prev.officials ?? []).map((item) =>
            item.id === official.id ? result.official : item
          ),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status pengurus.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-secondary">refresh</span>
        <span className="ml-2 text-sm text-muted">Memuat data...</span>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "profil", label: "Info & Publish", icon: "info" },
    { key: "tampilan", label: "Tampilan", icon: "palette" },
    { key: "pelatih", label: "Pelatih", icon: "sports_martial_arts" },
    { key: "pengurus", label: "Pengurus", icon: "groups" },
    { key: "galeri", label: "Galeri", icon: "photo_library" },
    { key: "prestasi", label: "Prestasi", icon: "emoji_events" },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-secondary text-secondary"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profil" && (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
          <div className="rounded-lg border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold text-primary">Status Halaman Publik</h3>
            <label className={`flex items-center gap-3 ${hasPublicWebsite ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
              <div
                className={`relative h-6 w-11 rounded-full transition ${isPublished ? "bg-secondary" : "bg-border"}`}
                onClick={() => {
                  if (hasPublicWebsite) setIsPublished((v) => !v);
                }}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
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
                ? "Aktifkan agar halaman publik akademi Anda bisa diakses oleh siapapun."
                : "Fitur halaman publik tersedia untuk paket Pro atau Scale."}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-white p-5">
            <h3 className="text-sm font-bold text-primary">Kontak & CTA</h3>
            <div>
              <label className="mb-1 block text-sm font-semibold text-primary">
                Nomor WhatsApp
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">+62</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  placeholder="81234567890"
                  className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <p className="mt-1 text-xs text-muted">Tanpa 0 di depan. Contoh: 81234567890</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-primary">
                Teks Tombol WhatsApp
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Hubungi via WhatsApp"
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex h-10 w-fit items-center gap-2 rounded-md bg-secondary px-5 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
            Simpan Perubahan
          </button>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-white p-5">
            <h3 className="text-sm font-bold text-primary">Informasi Publik</h3>
            <div>
              <label className="mb-1 block text-sm font-semibold text-primary">
                Deskripsi Akademi
              </label>
              <textarea
                rows={5}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Ceritakan akademi Anda kepada calon siswa..."
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-primary">
                Visi
              </label>
              <textarea
                rows={3}
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Visi akademi..."
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-primary">
                Misi
              </label>
              <textarea
                rows={4}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Tulis misi akademi, bisa beberapa baris..."
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>
        </div>
      )}

      {tab === "tampilan" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
          <div className="grid gap-4 rounded-lg border border-border bg-white p-5 sm:grid-cols-2">
            {[
              ["Warna utama", primaryColor, setPrimaryColor],
              ["Warna tombol", buttonColor, setButtonColor],
              ["Warna background", backgroundColor, setBackgroundColor],
              ["Warna teks", textColor, setTextColor],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="block text-sm font-semibold text-primary">
                {label as string}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={value as string}
                    onChange={(e) => (setter as (next: string) => void)(e.target.value)}
                    className="h-11 w-14 rounded-md border border-border bg-white p-1"
                  />
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => (setter as (next: string) => void)(e.target.value)}
                    className="h-11 flex-1 rounded-md border border-border px-3 text-sm text-primary"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-white p-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-primary">
              Font heading
              <select
                className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
              >
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-primary">
              Font body
              <select
                className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm"
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
              >
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-primary sm:col-span-2">
              Radius tombol: {buttonRadius}px
              <input
                type="range"
                min={0}
                max={32}
                value={buttonRadius}
                onChange={(e) => setButtonRadius(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <p className="mb-3 text-sm font-bold text-primary">Preview</p>
            <div
              className="rounded-lg p-5"
              style={{ backgroundColor, color: textColor, fontFamily: bodyFont }}
            >
              <h3 className="text-2xl font-black" style={{ color: primaryColor, fontFamily: headingFont }}>
                Nama Akademi
              </h3>
              <p className="mt-2 text-sm">Contoh teks profil publik akademi.</p>
              <button
                type="button"
                className="mt-4 px-5 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: buttonColor, borderRadius: buttonRadius }}
              >
                {ctaLabel || "Hubungi via WhatsApp"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-md bg-secondary px-5 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
            Simpan Tampilan
          </button>
        </div>
      )}

      {tab === "pelatih" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Pilih pelatih yang ingin ditampilkan di halaman publik akademi.
          </p>
          {coaches.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Belum ada pelatih terdaftar.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-white">
              {coaches.map((coach) => (
                <div key={coach.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {coach.photo_url ? (
                      <img
                        src={coach.photo_url}
                        alt={coach.name}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-surface">
                        <span className="material-symbols-outlined text-[20px] text-muted">person</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">{coach.name}</p>
                      {coach.rank_label && (
                        <p className="text-xs text-muted">{coach.rank_label}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex cursor-pointer items-center gap-2">
                    <span className="text-xs text-muted">
                      {coach.show_on_public ? "Ditampilkan" : "Disembunyikan"}
                    </span>
                    <div
                      className={`relative h-6 w-11 rounded-full transition ${
                        coach.show_on_public ? "bg-secondary" : "bg-border"
                      }`}
                      onClick={() => handleToggleCoach(coach)}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          coach.show_on_public ? "left-5" : "left-0.5"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pengurus" && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-white p-4">
            <h4 className="mb-3 text-sm font-bold text-primary">Tambah Pengurus Publik</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nama pengurus"
                value={newOfficial.name}
                onChange={(e) => setNewOfficial((p) => ({ ...p, name: e.target.value }))}
                className="rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <input
                type="text"
                placeholder="Jabatan, contoh: Ketua / Bendahara"
                value={newOfficial.position}
                onChange={(e) => setNewOfficial((p) => ({ ...p, position: e.target.value }))}
                className="rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewOfficialFile(e.target.files?.[0] ?? null)}
                className="rounded-md border border-border px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
              />
              <input
                type="text"
                placeholder="URL foto opsional"
                value={newOfficial.photo_url}
                onChange={(e) => setNewOfficial((p) => ({ ...p, photo_url: e.target.value }))}
                className="rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <textarea
                rows={2}
                placeholder="Deskripsi singkat opsional"
                value={newOfficial.description}
                onChange={(e) => setNewOfficial((p) => ({ ...p, description: e.target.value }))}
                className="md:col-span-2 rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <button
              type="button"
              onClick={handleAddOfficial}
              disabled={saving || !newOfficial.name.trim() || !newOfficial.position.trim()}
              className="mt-3 flex h-10 items-center gap-2 rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>}
              Tambah Pengurus
            </button>
          </div>

          {(!profile?.officials || profile.officials.length === 0) ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Belum ada pengurus publik. Tambahkan ketua, sekretaris, bendahara, atau pengurus lain.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-white">
              {profile.officials.map((official) => (
                <div key={official.id} className="px-4 py-4">
                  {editingOfficial?.id === official.id ? (
                    <div className="grid gap-3 md:grid-cols-[96px_1fr]">
                      <div className="overflow-hidden rounded-lg bg-surface">
                        {editingOfficial.photo_url ? (
                          <img src={editingOfficial.photo_url} alt={editingOfficial.name} className="h-24 w-full object-cover" />
                        ) : (
                          <div className="flex h-24 items-center justify-center text-muted">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          type="text"
                          value={editingOfficial.name}
                          onChange={(e) => setEditingOfficial((p) => (p ? { ...p, name: e.target.value } : p))}
                          className="rounded-md border border-border px-3 py-2 text-sm text-primary"
                        />
                        <input
                          type="text"
                          value={editingOfficial.position}
                          onChange={(e) => setEditingOfficial((p) => (p ? { ...p, position: e.target.value } : p))}
                          className="rounded-md border border-border px-3 py-2 text-sm text-primary"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditingOfficialFile(e.target.files?.[0] ?? null)}
                          className="rounded-md border border-border px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                        />
                        <input
                          type="text"
                          value={editingOfficial.photo_url ?? ""}
                          onChange={(e) => setEditingOfficial((p) => (p ? { ...p, photo_url: e.target.value || null } : p))}
                          placeholder="URL foto opsional"
                          className="rounded-md border border-border px-3 py-2 text-sm text-primary"
                        />
                        <textarea
                          rows={2}
                          value={editingOfficial.description ?? ""}
                          onChange={(e) => setEditingOfficial((p) => (p ? { ...p, description: e.target.value || null } : p))}
                          className="md:col-span-2 rounded-md border border-border px-3 py-2 text-sm text-primary"
                        />
                        <div className="md:col-span-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleUpdateOfficial}
                            disabled={saving || !editingOfficial.name.trim() || !editingOfficial.position.trim()}
                            className="rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOfficial(null);
                              setEditingOfficialFile(null);
                            }}
                            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {official.photo_url ? (
                          <img src={official.photo_url} alt={official.name} className="size-14 rounded-lg object-cover" />
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-lg bg-surface text-muted">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-primary">{official.name}</p>
                          <p className="text-xs font-semibold text-secondary">{official.position}</p>
                          {official.description && (
                            <p className="mt-1 text-xs text-muted">{official.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleOfficial(official)}
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            official.is_active ? "bg-emerald-50 text-emerald-600" : "bg-surface text-muted"
                          }`}
                        >
                          {official.is_active ? "Aktif" : "Hidden"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOfficial(official)}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOfficial(official)}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "galeri" && (
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-primary">Hero Images</h3>
                <p className="mt-1 text-sm text-muted">
                  Maksimal 3 gambar untuk slider utama halaman publik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openHeroModal()}
                disabled={(profile?.hero_images?.length ?? 0) >= 3}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition ${
                  (profile?.hero_images?.length ?? 0) >= 3
                    ? "cursor-not-allowed bg-muted/50"
                    : "cursor-pointer bg-secondary hover:bg-secondary/90"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                Tambah Hero
              </button>
            </div>

            {(!profile?.hero_images || profile.hero_images.length === 0) ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
                <span className="material-symbols-outlined text-[36px] text-muted">wallpaper</span>
                <p className="mt-2 text-sm text-muted">Belum ada gambar hero.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {profile.hero_images.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-border">
                    <div className="relative aspect-video bg-surface">
                      <img
                        src={item.image_url}
                        alt={item.caption ?? "Hero"}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 50}%` }}
                      />
                      <span
                        className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-secondary shadow"
                        style={{ left: `${item.focal_x ?? 50}%`, top: `${item.focal_y ?? 50}%` }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteHero(item)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <div className="border-t border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openHeroModal(item)}
                        className="flex w-full items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold text-primary hover:border-secondary hover:text-secondary"
                      >
                        <span className="material-symbols-outlined text-[16px]">crop</span>
                        Atur posisi
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleHero(item)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-primary"
                    >
                      <span>{item.is_active ? "Aktif di hero" : "Disembunyikan"}</span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition ${item.is_active ? "bg-secondary" : "bg-border"}`}
                      >
                        <span
                          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                            item.is_active ? "left-4" : "left-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-primary">Galeri Foto</h3>
                <p className="mt-1 text-sm text-muted">
                  Bank dokumentasi. Centang foto yang ingin dipakai di slider About Us.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(true)}
                className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white transition hover:bg-secondary/90"
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                Tambah Foto
              </button>
            </div>

            {(!profile?.gallery_items || profile.gallery_items.length === 0) ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-10 text-center">
                <span className="material-symbols-outlined text-[40px] text-muted">photo_library</span>
                <p className="mt-2 text-sm text-muted">Belum ada foto. Unggah foto pertama Anda.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {profile.gallery_items.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-border bg-white"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={item.image_url}
                        alt={item.caption ?? "Gallery"}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteGallery(item)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAboutGallery(item)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-primary"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${item.show_on_about ? "text-secondary" : "text-muted"}`}>
                        {item.show_on_about ? "check_box" : "check_box_outline_blank"}
                      </span>
                      Tampilkan di About Us
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "prestasi" && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-white p-4">
            <h4 className="mb-3 text-sm font-bold text-primary">Tambah Prestasi Baru</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Judul prestasi, contoh: Juara 1 Kejurnas 2024"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <textarea
                rows={2}
                placeholder="Keterangan (opsional)"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={newAchievement.achieved_on}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, achieved_on: e.target.value }))}
                  className="rounded-md border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  disabled={saving || !newAchievement.title.trim()}
                  className="flex h-10 items-center gap-2 rounded-md bg-secondary px-4 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {(!profile?.achievements || profile.achievements.length === 0) ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Belum ada prestasi. Tambahkan prestasi akademi Anda.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-white">
              {profile.achievements.map((achievement) => (
                <div key={achievement.id} className="px-4 py-3">
                  {editingAchievement?.id === achievement.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingAchievement.title}
                        onChange={(e) =>
                          setEditingAchievement((p) => (p ? { ...p, title: e.target.value } : p))
                        }
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                      <textarea
                        rows={2}
                        value={editingAchievement.description ?? ""}
                        onChange={(e) =>
                          setEditingAchievement((p) =>
                            p ? { ...p, description: e.target.value || null } : p
                          )
                        }
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editingAchievement.achieved_on ?? ""}
                          onChange={(e) =>
                            setEditingAchievement((p) =>
                              p ? { ...p, achieved_on: e.target.value || null } : p
                            )
                          }
                          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateAchievement}
                          disabled={saving}
                          className="rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAchievement(null)}
                          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{achievement.title}</p>
                        {achievement.description && (
                          <p className="text-xs text-muted">{achievement.description}</p>
                        )}
                        {achievement.achieved_on && (
                          <p className="text-xs text-muted">
                            {new Date(achievement.achieved_on).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingAchievement(achievement)}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAchievement(achievement)}
                          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showHeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-primary">
                  {editingHero ? "Atur Hero Image" : "Tambah Hero Image"}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Crop to shape: frame hero tetap, gambar di belakang mask yang digeser.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHeroModal}
                disabled={uploadingHero}
                className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-primary disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                {!editingHero ? (
                  <label className="block text-sm font-semibold text-primary">
                    Upload your image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleHeroFileChange(e.target.files?.[0] ?? null)}
                      className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                      disabled={uploadingHero}
                    />
                  </label>
                ) : (
                  <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">
                    Gambar hero tersimpan. Gunakan area crop di bawah untuk mengatur posisi.
                  </div>
                )}

                <label className="block text-sm font-semibold text-primary">
                  Caption hero
                  <input
                    type="text"
                    value={heroCaption}
                    onChange={(e) => setHeroCaption(e.target.value)}
                    placeholder="Contoh: Latihan disiplin dan teknik"
                    className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    disabled={uploadingHero}
                  />
                </label>
              </div>

              <div>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setHeroPanX((value) => Math.max(-100, value - 2));
                    if (e.key === "ArrowRight") setHeroPanX((value) => Math.min(100, value + 2));
                    if (e.key === "ArrowUp") setHeroPanY((value) => Math.max(-100, value - 2));
                    if (e.key === "ArrowDown") setHeroPanY((value) => Math.min(100, value + 2));
                  }}
                  className="relative aspect-[16/7] touch-none select-none overflow-hidden rounded-lg bg-slate-950"
                  title="Tahan lalu geser gambar di dalam mask hero"
                >
                  {heroPreviewUrl ? (
                    <>
                      <img
                        src={heroPreviewUrl}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 h-full w-full select-none object-cover opacity-25 blur-[1px]"
                        style={{
                          transform: `translate(${heroPanX}%, ${heroPanY}%) scale(${heroZoom / 100})`,
                          transformOrigin: "center",
                        }}
                      />
                      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)" }}>
                        <img
                          src={heroPreviewUrl}
                          alt=""
                          draggable={false}
                          className="h-full w-full select-none object-cover"
                          style={{
                            transform: `translate(${heroPanX}%, ${heroPanY}%) scale(${heroZoom / 100})`,
                            transformOrigin: "center",
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-end pr-20 text-white/30"
                      style={{ clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)" }}
                    >
                      <span className="material-symbols-outlined text-6xl">wallpaper</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[56%] bg-primary" />
                  <div
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                      backgroundColor: buttonColor,
                      clipPath: "polygon(57% 0%, 59.5% 0%, 49.5% 100%, 47% 100%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)",
                      background: "rgba(3,22,54,0.2)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 z-30 border-2 border-dashed border-white/70"
                    style={{
                      clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)",
                    }}
                  />
                  <div className="pointer-events-none absolute left-8 top-1/2 z-30 -translate-y-1/2 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: buttonColor }}>Preview Hero</p>
                    <p className="mt-3 max-w-[280px] text-4xl font-black uppercase leading-none">
                      Nama Akademi
                    </p>
                  </div>
                  <div
                    role="presentation"
                    onPointerDown={startHeroDrag}
                    onPointerMove={moveHeroDrag}
                    onPointerUp={() => setHeroDragStart(null)}
                    onPointerCancel={() => setHeroDragStart(null)}
                    className="absolute inset-0 z-40 cursor-grab touch-none active:cursor-grabbing"
                  />
                </div>

                <p className="mt-3 text-xs text-muted">
                  Drag gambar di preview seperti crop di Word. Area terang adalah bagian yang masuk ke shape hero.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHeroZoom((value) => Math.max(100, value - 10))}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-lg font-bold text-primary hover:border-secondary hover:text-secondary"
                  >
                    -
                  </button>
                  <div className="min-w-20 rounded-md border border-border px-3 py-2 text-center text-sm font-bold text-primary">
                    {heroZoom}%
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroZoom((value) => Math.min(200, value + 10))}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-lg font-bold text-primary hover:border-secondary hover:text-secondary"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeroPanX(heroInitialPanX);
                      setHeroPanY(heroInitialPanY);
                      setHeroZoom(heroInitialZoom);
                    }}
                    className="ml-auto rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:border-secondary hover:text-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={closeHeroModal}
                disabled={uploadingHero}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:bg-surface disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveHeroImage}
                disabled={uploadingHero || (!editingHero && !heroFile)}
                className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary/90 disabled:opacity-60"
              >
                {uploadingHero && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                )}
                Simpan Hero
              </button>
            </div>
          </div>
        </div>
      )}

      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-primary">Tambah Foto Galeri</h3>
                <p className="mt-1 text-sm text-muted">
                  Pilih gambar dan isi keterangan yang akan tampil di landing page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (uploadingGallery) return;
                  setShowGalleryModal(false);
                  setGalleryFile(null);
                  setGalleryCaption("");
                }}
                className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="block text-sm font-semibold text-primary">
                Gambar
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-primary file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                  disabled={uploadingGallery}
                />
              </label>

              {galleryFile && (
                <div className="rounded-md border border-border bg-surface p-3 text-sm text-primary">
                  <span className="font-semibold">File:</span> {galleryFile.name}
                </div>
              )}

              <label className="block text-sm font-semibold text-primary">
                Keterangan gambar
                <input
                  type="text"
                  value={galleryCaption}
                  onChange={(e) => setGalleryCaption(e.target.value)}
                  placeholder="Contoh: Latihan teknik dasar"
                  className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  disabled={uploadingGallery}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowGalleryModal(false);
                  setGalleryFile(null);
                  setGalleryCaption("");
                }}
                disabled={uploadingGallery}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:bg-surface disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGalleryUpload}
                disabled={uploadingGallery || !galleryFile}
                className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary/90 disabled:opacity-60"
              >
                {uploadingGallery && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                )}
                Simpan Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
