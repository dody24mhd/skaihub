"use client";

import { useEffect } from "react";
import { shouldRegisterServiceWorker } from "@/lib/pwa/update-manager";

export default function SwRegister() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker(process.env.NODE_ENV, "serviceWorker" in navigator)) {
      return;
    }

    // First install also fires controllerchange (clients.claim); only reload when replacing an existing worker.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        // Jika service worker baru sudah dalam state waiting
        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(
            new CustomEvent("sw-update-available", { detail: registration })
          );
        }

        // Pantau jika ada pembaruan baru
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("sw-update-available", { detail: registration })
              );
            }
          });
        });
      })
      .catch(() => {
        // Service worker gagal registrasi (abaikan secara silent di client)
      });
  }, []);

  return null;
}
