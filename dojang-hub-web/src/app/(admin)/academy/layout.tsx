import type { Metadata, Viewport } from "next";
import SwRegister from "../_components/pwa/sw-register";
import UpdateToast from "../_components/pwa/update-toast";
import InstallPrompt from "../_components/pwa/install-prompt";

export const metadata: Metadata = {
  manifest: "/manifest-academy.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SKAIHUB Akademi",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#031636",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SwRegister />
      <UpdateToast />
      <InstallPrompt />
    </>
  );
}
