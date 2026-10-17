import { IS_DEMO_SNAPSHOT, readSnapshot } from "@/lib/demo-snapshot";
import { API_URL } from "./api";

// ─── Raw API types ────────────────────────────────────────────────────────────

type ApiTestimonial = {
  akademi_name: string;
  person_name: string;
  quote: string;
};

type ApiFaq = {
  question: string;
  answer: string;
};

type ApiEvent = {
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  organizer_name: string | null;
  registration_url: string | null;
  category: string;
  status: "draft" | "published" | "cancelled";
  is_featured: boolean;
  starts_at: string;
  ends_at: string | null;
};

type ApiBlogPost = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  category: string | null;
  author_name: string | null;
  published_at: string | null;
};

// ─── Public types (used by components) ───────────────────────────────────────

export type HomeTestimonial = {
  name: string;
  academy: string;
  quote: string;
};

export type HomeFaq = {
  q: string;
  a: string;
};

export type PublicEvent = {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  coverImage: string | null;
  location: string;
  organizer: string;
  registrationUrl: string | null;
  category: string;
  isFeatured: boolean;
  startsAt: string;
  endsAt: string | null;
};

export type PublicBlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
  category: string;
  authorName: string;
  publishedAt: string | null;
};

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJson<T>(path: string): Promise<T | null> {
  if (IS_DEMO_SNAPSHOT) return readSnapshot<T>(path);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public data functions ────────────────────────────────────────────────────

export async function getHomeTestimonials(): Promise<HomeTestimonial[]> {
  const data = await fetchJson<ApiTestimonial[]>("/compro/testimonials");

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    name: item.person_name,
    academy: item.akademi_name,
    quote: item.quote,
  }));
}

export async function getHomeFaqs(): Promise<HomeFaq[]> {
  const data = await fetchJson<ApiFaq[]>("/compro/faqs");

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    q: item.question,
    a: item.answer,
  }));
}

export async function getPublicEvents(limit?: number): Promise<PublicEvent[]> {
  const data = await fetchJson<ApiEvent[]>("/compro/events");

  if (!Array.isArray(data)) return [];

  const events = data.map((item) => ({
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || item.description || "Agenda SKAIHUB.",
    description: item.description || item.excerpt || "",
    coverImage: item.cover_image_url,
    location: item.location || "Lokasi menyusul",
    organizer: item.organizer_name || "SKAIHUB",
    category: item.category || "Umum",
    registrationUrl: item.registration_url,
    isFeatured: item.is_featured,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
  }));

  const sorted = [...events].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent | null> {
  const data = await fetchJson<ApiEvent>(`/compro/events/${slug}`);
  if (!data) return null;

  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || data.description || "Agenda SKAIHUB.",
    description: data.description || data.excerpt || "",
    coverImage: data.cover_image_url,
    location: data.location || "Lokasi menyusul",
    organizer: data.organizer_name || "SKAIHUB",
    category: data.category || "Umum",
    registrationUrl: data.registration_url,
    isFeatured: data.is_featured,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
  };
}

export async function getPublicBlogPosts(limit?: number): Promise<PublicBlogPost[]> {
  const data = await fetchJson<ApiBlogPost[]>("/compro/blog");

  if (!Array.isArray(data)) return [];

  const posts = data.map((item) => ({
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || item.content.slice(0, 140),
    content: item.content,
    thumbnailUrl: item.thumbnail_url,
    category: item.category || "Berita",
    authorName: item.author_name || "SKAIHUB",
    publishedAt: item.published_at,
  }));

  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt || 0).getTime() -
      new Date(a.publishedAt || 0).getTime()
  );

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getPublicBlogPostBySlug(slug: string): Promise<PublicBlogPost | null> {
  const data = await fetchJson<ApiBlogPost>(`/compro/blog/${slug}`);
  if (!data) return null;

  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || data.content.slice(0, 140),
    content: data.content,
    thumbnailUrl: data.thumbnail_url,
    category: data.category || "Berita",
    authorName: data.author_name || "SKAIHUB",
    publishedAt: data.published_at,
  };
}

export async function incrementPublicBlogView(slug: string): Promise<boolean> {
  if (IS_DEMO_SNAPSHOT) return false;

  try {
    const response = await fetch(`${API_URL}/compro/blog/${slug}/view`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function incrementPublicEventView(slug: string): Promise<boolean> {
  if (IS_DEMO_SNAPSHOT) return false;

  try {
    const response = await fetch(`${API_URL}/compro/events/${slug}/view`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type SiteSettings = Record<string, string>;

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await fetchJson<SiteSettings>("/compro/settings");
  return data && typeof data === "object" ? data : {};
}


