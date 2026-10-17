import type { MetadataRoute } from "next";
import { getPublicBlogPosts, getPublicEvents } from "./(compro)/_lib/compro-data";

const baseUrl = "https://skaihub.com";

const staticRoutes = ["", "/fitur", "/harga", "/event", "/berita", "/tentang", "/hubungi"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, events] = await Promise.all([
    getPublicBlogPosts(),
    getPublicEvents(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/berita/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/event/${event.slug}`,
    lastModified: new Date(event.startsAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries, ...eventEntries];
}
