import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (public files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Define the base domain (adjust for local development)
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
  
  // Extract subdomain
  let subdomain = '';
  if (hostname.includes(baseDomain)) {
    subdomain = hostname.replace(`.${baseDomain}`, '').replace(baseDomain, '');
  }

  const path = url.pathname;

  // 1. Super Admin Panel (admin.skaihub.com)
  if (subdomain === 'admin') {
    const adminPath = path.startsWith('/admin')
      ? path
      : `/admin${path === '/' ? '' : path}`;

    return NextResponse.rewrite(new URL(adminPath, req.url));
  }

  // 2. Akademi subdomain (slug.skaihub.com)
  // Check if it's a subdomain (not empty and not 'admin' and not just the base domain)
  if (subdomain && subdomain !== '') {
    const academyPath = path === '/' ? `/a/${subdomain}` : `/a/${subdomain}${path}`;

    return NextResponse.rewrite(new URL(academyPath, req.url));
  }

  // 3. Compro Site (skaihub.com or base domain)
  // Route groups such as (compro) are not URL segments, so the base domain
  // should continue normally to src/app/(compro)/page.tsx.
  return NextResponse.next();
}
