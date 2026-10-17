"use client";

import { SportRank } from "../_lib/admin-api";
import { findBeltColor, resolveBeltColor } from "./belt-colors";

type RankBeltBadgeProps = {
  rank?: (Pick<SportRank, "code" | "label"> & Partial<Pick<SportRank, "belt_color" | "stripe_color">>) | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const UNKNOWN_BELT = { value: "unknown", label: "", bar: "bg-surface-container", border: "border-border" };

const sizeStyles = {
  sm: {
    wrapper: "gap-1.5",
    belt: "h-4 w-12",
    stripe: "w-1",
    label: "text-xs",
  },
  md: {
    wrapper: "gap-2",
    belt: "h-4 w-12",
    stripe: "w-1",
    label: "text-sm",
  },
  lg: {
    wrapper: "gap-2",
    belt: "h-5 w-14",
    stripe: "w-1.5",
    label: "text-sm",
  },
};

export default function AcademyRankBeltBadge({ rank, size = "md", showLabel = true, className = "" }: RankBeltBadgeProps) {
  const style = rank ? (resolveBeltColor(rank) ?? UNKNOWN_BELT) : undefined;
  const stripe = findBeltColor(rank?.stripe_color);
  const sizing = sizeStyles[size];

  if (!rank || !style) {
    return (
      <div className={`inline-flex items-center ${sizing.wrapper} ${className}`}>
        <span className={`rounded-sm border border-dashed border-border bg-surface-container ${sizing.belt}`} aria-hidden="true" />
        {showLabel ? <span className={`${sizing.label} font-semibold text-muted`}>Belum ada tingkatan</span> : null}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizing.wrapper} ${className}`}>
      <span
        className={`relative inline-flex overflow-hidden rounded-sm border ${style.border} ${style.bar} ${sizing.belt}`}
        aria-label={rank.label}
        data-belt-color={style.value}
      >
        {style.value === "red_black" ? <span className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" /> : null}
        <span className={`absolute left-1/2 top-0 h-full -translate-x-1/2 bg-white/70 ${sizing.stripe}`} />
        {stripe ? (
          <span
            className={`absolute inset-y-0 right-1.5 border-x ${stripe.border} ${stripe.bar} ${sizing.stripe}`}
            data-stripe-color={stripe.value}
          />
        ) : null}
      </span>
      {showLabel ? <span className={`${sizing.label} font-semibold text-primary`}>{rank.label}</span> : null}
    </div>
  );
}
