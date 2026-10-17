/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://skaihub.com"),
  title: {
    default: "SKAIHUB - Sistem Kelola Atlet Indonesia Hub",
    template: "%s | SKAIHUB",
  },
  description:
    "Platform manajemen akademi bela diri Indonesia — Taekwondo, Karate, dan cabang olahraga bela diri lainnya. Digitalisasi operasional, absensi, rapor digital, dan website profil akademi.",
  applicationName: "SKAIHUB",
  keywords: [
    "SKAIHUB",
    "manajemen akademi bela diri",
    "aplikasi taekwondo",
    "aplikasi karate",
    "absensi taekwondo",
    "absensi karate",
    "rapor digital bela diri",
    "website akademi bela diri",
    "sistem kelola atlet indonesia",
  ],
  authors: [{ name: "SKAIHUB" }],
  creator: "SKAIHUB",
  publisher: "SKAIHUB",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "SKAIHUB",
    title: "SKAIHUB - Sistem Kelola Atlet Indonesia Hub",
    description:
      "Platform manajemen akademi bela diri Indonesia (Taekwondo & Karate) untuk absensi, rapor digital, operasional, dan website profil akademi.",
    images: [
      {
        url: "/images/hero-mockup.png",
        width: 1200,
        height: 630,
        alt: "SKAIHUB platform manajemen akademi bela diri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SKAIHUB - Sistem Kelola Atlet Indonesia Hub",
    description:
      "Platform manajemen akademi bela diri Indonesia (Taekwondo & Karate) untuk absensi, rapor digital, operasional, dan website profil akademi.",
    images: ["/images/hero-mockup.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
