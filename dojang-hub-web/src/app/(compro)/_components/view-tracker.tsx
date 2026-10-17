"use client";

import { useEffect } from "react";
import { incrementPublicBlogView, incrementPublicEventView } from "../_lib/compro-data";

type ViewTrackerProps = {
  slug: string;
  type: "blog" | "event";
};

export function ViewTracker({ slug, type }: ViewTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `skaihub_viewed_${type}_${slug}`;
    const alreadyViewed = sessionStorage.getItem(storageKey);

    if (!alreadyViewed) {
      const increment = type === "blog" ? incrementPublicBlogView : incrementPublicEventView;
      increment(slug)
        .then((success) => {
          if (success) {
            sessionStorage.setItem(storageKey, "true");
          }
        })
        .catch((err) => console.error("Failed to track view:", err));
    }
  }, [slug, type]);

  return null; // This component doesn't render anything visually
}
