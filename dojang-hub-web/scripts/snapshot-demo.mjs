// Snapshot the public API (compro + academy pages) into static JSON + media
// so the web app can run on Vercel without a backend (NEXT_PUBLIC_DEMO_SNAPSHOT=1).
// Usage: node scripts/snapshot-demo.mjs [slug ...]   (local API must be running)
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = (process.env.SNAPSHOT_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const API_ORIGIN = new URL(API_URL).origin;
const SLUGS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["sriwijaya", "karate-musi"];
const MEDIA_DIR = join(ROOT, "public", "demo-media");
const SNAPSHOT_FILE = join(ROOT, "src", "lib", "demo-snapshot", "snapshot.json");
const MAX_IMAGE_WIDTH = 1920;
const IMAGE_QUALITY = 78;
const MEDIA_PATTERN = new RegExp(`${API_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/storage/[^"'\\s)<>]+)`, "g");

const mediaUrls = new Set();

async function getJson(path) {
  const response = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

function toLocalMedia(value) {
  if (typeof value === "string") {
    return value.replaceAll(MEDIA_PATTERN, (_, path) => {
      mediaUrls.add(path);
      return `/demo-media${path}`;
    });
  }
  if (Array.isArray(value)) return value.map(toLocalMedia);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toLocalMedia(item)]));
  }
  return value;
}

async function downloadMedia(path) {
  const response = await fetch(`${API_ORIGIN}${path}`);
  if (!response.ok) throw new Error(`media ${path} -> ${response.status}`);
  const target = join(MEDIA_DIR, ...path.split("/").filter(Boolean));
  await mkdir(dirname(target), { recursive: true });
  const original = Buffer.from(await response.arrayBuffer());
  const output = /\.(jpe?g|png|webp)$/i.test(path) ? await shrinkImage(original, path) : original;
  await writeFile(target, output);
}

async function shrinkImage(buffer, path) {
  const image = sharp(buffer).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
  if (/\.png$/i.test(path)) return image.png({ compressionLevel: 9 }).toBuffer();
  if (/\.webp$/i.test(path)) return image.webp({ quality: IMAGE_QUALITY }).toBuffer();
  return image.jpeg({ quality: IMAGE_QUALITY, mozjpeg: true }).toBuffer();
}

async function main() {
  const snapshot = {};
  for (const path of ["/compro/testimonials", "/compro/faqs", "/compro/settings", "/compro/events", "/compro/blog"]) {
    snapshot[path] = await getJson(path);
  }
  for (const event of snapshot["/compro/events"]) {
    snapshot[`/compro/events/${event.slug}`] = await getJson(`/compro/events/${event.slug}`);
  }
  for (const post of snapshot["/compro/blog"]) {
    snapshot[`/compro/blog/${post.slug}`] = await getJson(`/compro/blog/${post.slug}`);
  }
  for (const slug of SLUGS) {
    snapshot[`/public/akademi/${slug}`] = await getJson(`/public/akademi/${slug}`);
  }

  const localized = toLocalMedia(snapshot);
  for (const path of mediaUrls) await downloadMedia(path);

  await mkdir(dirname(SNAPSHOT_FILE), { recursive: true });
  await writeFile(SNAPSHOT_FILE, `${JSON.stringify(localized, null, 2)}\n`);
  console.info(`Snapshot: ${Object.keys(localized).length} endpoints, ${mediaUrls.size} media files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
