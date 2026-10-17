"use client";

import { SportRank } from "../_lib/admin-api";

type RankBeltBadgeProps = {
  rank?: Pick<SportRank, "code" | "label"> | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const beltStyles: Record<string, { name: string; bar: string; border: string; text: string }> = {
  white: {
    name: "Putih",
    bar: "bg-white",
    border: "border-slate-300",
    text: "text-primary",
  },
  yellow: {
    name: "Kuning",
    bar: "bg-yellow-300",
    border: "border-yellow-500",
    text: "text-primary",
  },
  green: {
    name: "Hijau",
    bar: "bg-emerald-500",
    border: "border-emerald-700",
    text: "text-primary",
  },
  blue: {
    name: "Biru",
    bar: "bg-blue-600",
    border: "border-blue-800",
    text: "text-primary",
  },
  red: {
    name: "Merah",
    bar: "bg-red-600",
    border: "border-red-800",
    text: "text-primary",
  },
  poom: {
    name: "Poom",
    bar: "bg-red-600",
    border: "border-neutral-900",
    text: "text-primary",
  },
  black: {
    name: "Hitam",
    bar: "bg-neutral-950",
    border: "border-neutral-700",
    text: "text-primary",
  },
};

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

function rankStyle(rank?: Pick<SportRank, "code" | "label"> | null) {
  if (!rank) return null;

  const key = rank.code?.toLowerCase();
  if (beltStyles[key]) return beltStyles[key];

  const label = rank.label.toLowerCase();
  return Object.entries(beltStyles).find(([code, style]) => label.includes(code) || label.includes(style.name.toLowerCase()))?.[1] || null;
}

export default function AcademyRankBeltBadge({ rank, size = "md", showLabel = true, className = "" }: RankBeltBadgeProps) {
  const style = rankStyle(rank);
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
      <span className={`relative inline-flex overflow-hidden rounded-sm border ${style.border} ${style.bar} ${sizing.belt}`} aria-label={rank.label}>
        {rank.code === "poom" ? <span className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" /> : null}
        <span className={`absolute left-1/2 top-0 h-full -translate-x-1/2 bg-white/70 ${sizing.stripe}`} />
      </span>
      {showLabel ? <span className={`${sizing.label} font-semibold ${style.text}`}>{rank.label}</span> : null}
    </div>
  );
}
