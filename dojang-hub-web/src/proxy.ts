import { NextRequest, NextResponse } from "next/server";
import { IS_DEMO_SNAPSHOT } from "@/lib/demo-snapshot";
import { resolveRewrite } from "@/lib/routing/resolve-rewrite";

const DEMO_BLOCKED_PREFIXES = ["/login", "/academy", "/internal"];

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (public files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";

  // Static demo has no backend, so app (login/dashboard) routes go home.
  if (IS_DEMO_SNAPSHOT && DEMO_BLOCKED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const target = resolveRewrite(hostname, url.pathname, baseDomain);

  if (target) {
    return NextResponse.rewrite(new URL(target, req.url));
  }

  return NextResponse.next();
}
