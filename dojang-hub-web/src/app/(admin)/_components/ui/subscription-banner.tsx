"use client";

import { SubscriptionLifecycleState } from "../../_lib/admin-api";
import { SubscriptionStatus, useSubscriptionStatus } from "./subscription-status";

type BannerState = Exclude<SubscriptionLifecycleState, "active">;

const BANNER_STYLES: Record<BannerState, { container: string; icon: string; iconName: string; title: string }> = {
  expiring: {
    container: "border-belt-yellow bg-belt-yellow/15",
    icon: "text-primary",
    iconName: "schedule",
    title: "Langganan segera berakhir",
  },
  grace: {
    container: "border-caution bg-caution/10",
    icon: "text-caution",
    iconName: "hourglass_bottom",
    title: "Masa tenggang",
  },
  read_only: {
    container: "border-secondary bg-secondary/10",
    icon: "text-secondary",
    iconName: "lock",
    title: "Mode baca-saja",
  },
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function bannerMessage(status: SubscriptionStatus): string {
  if (status.state === "expiring") {
    const when = status.daysLeft > 0 ? `berakhir dalam ${status.daysLeft} hari` : "berakhir hari ini";
    return `Langganan akademi ${when} (${formatDate(status.endsAt)}). Hubungi SKAIHUB untuk perpanjangan agar operasional tidak terhenti.`;
  }

  if (status.state === "grace") {
    return `Langganan sudah berakhir. Masa tenggang tersisa ${status.daysLeft} hari, setelah itu akun menjadi baca-saja. Segera lakukan pembayaran perpanjangan.`;
  }

  return "Langganan sudah berakhir. Data tetap bisa dilihat dan diekspor, tetapi tidak bisa ditambah atau diubah sampai pembayaran perpanjangan dicatat oleh SKAIHUB.";
}

export default function SubscriptionBanner() {
  const status = useSubscriptionStatus();

  if (!status || status.state === "active") return null;

  const style = BANNER_STYLES[status.state];

  return (
    <div
      role="status"
      data-testid="subscription-banner"
      data-state={status.state}
      className={`flex items-start gap-3 border-l-4 px-4 py-3 text-sm text-primary lg:px-8 ${style.container}`}
    >
      <span aria-hidden="true" className={`material-symbols-outlined mt-0.5 text-[20px] ${style.icon}`}>
        {style.iconName}
      </span>
      <p className="min-w-0 leading-6">
        <span className="font-bold">{style.title}. </span>
        {bannerMessage(status)}
      </p>
    </div>
  );
}
