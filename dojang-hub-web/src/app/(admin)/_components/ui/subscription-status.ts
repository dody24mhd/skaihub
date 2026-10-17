"use client";

import { useEffect, useState } from "react";
import { SubscriptionLifecycleState, getAkademiSubscriptionStatus } from "../../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

export type SubscriptionStatus = {
  state: SubscriptionLifecycleState;
  daysLeft: number;
  endsAt: string | null;
};

let pending: Promise<SubscriptionStatus | null> | null = null;

/** Satu permintaan /akademi/me per muat halaman, dipakai bersama banner dan useCanWrite. */
export function loadSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  if (pending) return pending;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return Promise.resolve(null);

  pending = getAkademiSubscriptionStatus(token)
    .then((me): SubscriptionStatus | null =>
      me.subscription_state
        ? { state: me.subscription_state, daysLeft: me.days_left, endsAt: me.subscription_ends_at }
        : null,
    )
    .catch(() => {
      // Status hanya informatif di UI; server tetap menolak penulisan saat baca-saja.
      pending = null;
      return null;
    });

  return pending;
}

export function resetSubscriptionStatus(): void {
  pending = null;
}

export function useSubscriptionStatus(): SubscriptionStatus | null {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let active = true;
    loadSubscriptionStatus().then((next) => {
      if (active) setStatus(next);
    });

    return () => {
      active = false;
    };
  }, []);

  return status;
}

export function useCanWrite(): boolean {
  return useSubscriptionStatus()?.state !== "read_only";
}
