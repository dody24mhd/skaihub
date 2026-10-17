import type { NextConfig } from "next";
import { buildImageRemotePatterns } from "./src/lib/config/image-remote-patterns";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["169.254.83.107", "localhost:3000"],
  images: {
    remotePatterns: buildImageRemotePatterns({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_ASSET_HOSTS: process.env.NEXT_PUBLIC_ASSET_HOSTS,
    }),
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/admin/academy/:path*",
        destination: "/academy/:path*",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/internal",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/internal/:path*",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/manifest-academy.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
