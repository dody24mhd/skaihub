/**
 * Builds `images.remotePatterns` for next.config.ts from env (evaluated at build time).
 * - Local API storage (dev) is always allowed.
 * - Origin of NEXT_PUBLIC_API_URL + `/storage/**` (Laravel public disk in production).
 * - NEXT_PUBLIC_ASSET_HOSTS: comma-separated base URLs, e.g. an R2 public bucket
 *   (`https://pub-xxx.r2.dev`) or a CDN with path prefix (`https://cdn.example.com/skaihub`).
 */
export type ImageRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

type ImageEnv = {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_ASSET_HOSTS?: string;
};

const LOCAL_API_HOSTS = ["localhost", "127.0.0.1"];
const LOCAL_API_PORT = "8000";
const STORAGE_PATH = "/storage";

function toPattern(rawUrl: string, pathPrefix?: string): ImageRemotePattern | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const basePath = (pathPrefix ?? url.pathname).replace(/\/+$/, "");

  return {
    protocol: url.protocol === "https:" ? "https" : "http",
    hostname: url.hostname,
    port: url.port,
    pathname: `${basePath}/**`,
  };
}

export function buildImageRemotePatterns(env: ImageEnv): ImageRemotePattern[] {
  const candidates: (ImageRemotePattern | null)[] = LOCAL_API_HOSTS.map((host) =>
    toPattern(`http://${host}:${LOCAL_API_PORT}`, STORAGE_PATH),
  );

  if (env.NEXT_PUBLIC_API_URL) {
    candidates.push(toPattern(env.NEXT_PUBLIC_API_URL, STORAGE_PATH));
  }

  for (const entry of (env.NEXT_PUBLIC_ASSET_HOSTS ?? "").split(",")) {
    if (entry.trim()) {
      candidates.push(toPattern(entry));
    }
  }

  const seen = new Set<string>();

  return candidates.filter((pattern): pattern is ImageRemotePattern => {
    if (!pattern) return false;
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port}${pattern.pathname}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
