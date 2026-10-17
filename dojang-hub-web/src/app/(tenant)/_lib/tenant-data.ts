import { IS_DEMO_SNAPSHOT, readSnapshot } from "@/lib/demo-snapshot";

const DEFAULT_API_URL = "http://localhost:8000/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

// ─── Raw API types ─────────────────────────────────────────────────────────────

type ApiAkademiProfile = {
  akademi: {
    name: string;
    slug: string;
    sport_type: string;
    logo_url: string | null;
  };
  profile: {
    about: string | null;
    vision: string | null;
    mission: string | null;
    public_schedule: string | null;
    whatsapp: string | null;
    cta_label: string | null;
    primary_color: string | null;
    button_color: string | null;
    background_color: string | null;
    text_color: string | null;
    heading_font: string | null;
    body_font: string | null;
    button_radius: number | null;
  };
  coaches: Array<{
    name: string;
    rank_label: string | null;
    photo_url: string | null;
  }>;
  places: Array<{
    name: string;
    address: string | null;
  }>;
  hero_images: Array<{
    image_url: string;
    caption: string | null;
    focal_x: number | null;
    focal_y: number | null;
    pan_x: number | null;
    pan_y: number | null;
    zoom: number | null;
    sort_order: number;
  }>;
  gallery: Array<{
    image_url: string;
    caption: string | null;
    show_on_about: boolean;
    sort_order: number;
  }>;
  achievements: Array<{
    title: string;
    description: string | null;
    achieved_on: string | null;
    sort_order: number;
  }>;
  officials: Array<{
    name: string;
    position: string;
    photo_url: string | null;
    description: string | null;
    sort_order: number;
  }>;
};

// ─── Public types ──────────────────────────────────────────────────────────────

export type PublicAkademi = {
  name: string;
  slug: string;
  sportType: string;
  logoUrl: string | null;
  about: string | null;
  vision: string | null;
  mission: string | null;
  publicSchedule: string | null;
  whatsapp: string | null;
  ctaLabel: string | null;
  primaryColor: string;
  buttonColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: number;
  coaches: Array<{
    name: string;
    rankLabel: string | null;
    photoUrl: string | null;
  }>;
  places: Array<{
    name: string;
    address: string | null;
  }>;
  heroImages: Array<{
    imageUrl: string;
    caption: string | null;
    focalX: number;
    focalY: number;
    panX: number;
    panY: number;
    zoom: number;
  }>;
  gallery: Array<{
    imageUrl: string;
    caption: string | null;
    showOnAbout: boolean;
  }>;
  achievements: Array<{
    title: string;
    description: string | null;
    achievedOn: string | null;
  }>;
  officials: Array<{
    name: string;
    position: string;
    photoUrl: string | null;
    description: string | null;
  }>;
};

// ─── Fetch ─────────────────────────────────────────────────────────────────────

export async function getPublicAkademi(slug: string): Promise<PublicAkademi | null> {
  try {
    const data = IS_DEMO_SNAPSHOT
      ? readSnapshot<ApiAkademiProfile>(`/public/akademi/${slug}`)
      : await fetchAkademiProfile(slug);

    if (!data) return null;

    return {
      name: data.akademi.name,
      slug: data.akademi.slug,
      sportType: data.akademi.sport_type,
      logoUrl: data.akademi.logo_url,
      about: data.profile.about,
      vision: data.profile.vision,
      mission: data.profile.mission,
      publicSchedule: data.profile.public_schedule,
      whatsapp: data.profile.whatsapp,
      ctaLabel: data.profile.cta_label,
      primaryColor: data.profile.primary_color || "#031636",
      buttonColor: data.profile.button_color || "#d32f2f",
      backgroundColor: data.profile.background_color || "#f8fafc",
      textColor: data.profile.text_color || "#0f172a",
      headingFont: data.profile.heading_font || "Montserrat",
      bodyFont: data.profile.body_font || "Inter",
      buttonRadius: data.profile.button_radius ?? 8,
      coaches: data.coaches.map((c) => ({
        name: c.name,
        rankLabel: c.rank_label,
        photoUrl: c.photo_url,
      })),
      places: data.places.map((p) => ({
        name: p.name,
        address: p.address,
      })),
      heroImages: (data.hero_images ?? []).map((g) => ({
        imageUrl: g.image_url,
        caption: g.caption,
        focalX: g.focal_x ?? 50,
        focalY: g.focal_y ?? 50,
        panX: g.pan_x ?? 0,
        panY: g.pan_y ?? 0,
        zoom: g.zoom ?? 100,
      })),
      gallery: data.gallery.map((g) => ({
        imageUrl: g.image_url,
        caption: g.caption,
        showOnAbout: Boolean(g.show_on_about),
      })),
      achievements: data.achievements.map((a) => ({
        title: a.title,
        description: a.description,
        achievedOn: a.achieved_on,
      })),
      officials: (data.officials ?? []).map((o) => ({
        name: o.name,
        position: o.position,
        photoUrl: o.photo_url,
        description: o.description,
      })),
    };
  } catch {
    return null;
  }
}

async function fetchAkademiProfile(slug: string): Promise<ApiAkademiProfile | null> {
  const response = await fetch(`${API_URL}/public/akademi/${slug}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return response.ok ? response.json() : null;
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const clean = number.replace(/\D/g, "");
  const normalized = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
