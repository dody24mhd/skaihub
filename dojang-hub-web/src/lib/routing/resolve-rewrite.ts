/**
 * Resolves rewrite target for incoming requests based on host and pathname.
 * Pure function extracted from proxy.ts (B2 / D14).
 *
 * Rules:
 * 1. Subdomain 'admin':
 *    - '/' -> '/internal'
 *    - paths starting with '/internal', '/login', '/offline' -> no rewrite (null)
 *    - other paths -> `/internal${path}`
 * 2. Other reserved subdomains (RESERVED_SUBDOMAINS, e.g. 'www', 'app', 'api'):
 *    - no rewrite (null); 'www'/'app' therefore behave like the base domain
 * 3. Academy subdomains (any other non-empty subdomain):
 *    - '/' -> `/a/${subdomain}`
 *    - other paths -> `/a/${subdomain}${path}`
 * 4. Compro / main domain / IP:
 *    - no rewrite (null)
 */
// Keep in sync with dojang-hub-api/config/skaihub.php `reserved_subdomains`.
export const RESERVED_SUBDOMAINS: readonly string[] = [
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "static",
  "cdn",
  "status",
];
export function resolveRewrite(
  host: string,
  path: string,
  baseDomain: string
): string | null {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Strip ports and lowercase for comparison
  const cleanHost = (host || "").split(":")[0].toLowerCase().trim();
  const cleanBase = (baseDomain || "").split(":")[0].toLowerCase().trim();

  let subdomain = "";
  if (cleanHost && cleanBase && cleanHost !== cleanBase) {
    const suffix = `.${cleanBase}`;
    if (cleanHost.endsWith(suffix)) {
      subdomain = cleanHost.slice(0, -suffix.length);
    }
  }

  // 1. Super Admin Panel (admin.<baseDomain>)
  if (subdomain === "admin") {
    if (normalizedPath === "/") {
      return "/internal";
    }

    if (
      normalizedPath.startsWith("/internal") ||
      normalizedPath.startsWith("/login") ||
      normalizedPath.startsWith("/offline")
    ) {
      return null;
    }

    return `/internal${normalizedPath}`;
  }

  // 2. Subdomain sistem lain (www, app, api, ...) bukan slug akademi
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }

  // 3. Akademi subdomain (<slug>.<baseDomain>)
  if (subdomain && subdomain !== "") {
    return normalizedPath === "/"
      ? `/a/${subdomain}`
      : `/a/${subdomain}${normalizedPath}`;
  }

  // 4. Compro Site / Main Domain
  return null;
}
