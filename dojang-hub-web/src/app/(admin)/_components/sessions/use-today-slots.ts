"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TodaySlot, getAkademiTodaySessions } from "../../_lib/admin-api";
import { ROLE_KEY, TOKEN_KEY, resolveSlotSessionId, sessionFormHref } from "./today-utils";

const DEFAULT_BACKFILL_DAYS = 7;

export function useAdminSession(): { token: string; role: string | null; isReady: boolean } {
  const [state, setState] = useState({ token: "", role: null as string | null, isReady: false });

  useEffect(() => {
    queueMicrotask(() =>
      setState({
        token: localStorage.getItem(TOKEN_KEY) || "",
        role: localStorage.getItem(ROLE_KEY),
        isReady: true,
      }),
    );
  }, []);

  return state;
}

export function useTodaySlots(token: string, date: string, isReady: boolean) {
  const [slots, setSlots] = useState<TodaySlot[]>([]);
  const [backfillDays, setBackfillDays] = useState(DEFAULT_BACKFILL_DAYS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await getAkademiTodaySessions(token, date);
      setSlots(response.data);
      setBackfillDays(response.coach_backfill_days);
    } catch (caught) {
      setSlots([]);
      setError(caught instanceof Error ? caught.message : "Gagal memuat kelas hari ini.");
    } finally {
      setIsLoading(false);
    }
  }, [date, token]);

  useEffect(() => {
    if (!isReady) return;
    queueMicrotask(() => {
      void reload();
    });
  }, [isReady, reload]);

  return { slots, backfillDays, isLoading, error, reload };
}

export function useOpenSlot(token: string) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [openError, setOpenError] = useState("");

  const openSlot = useCallback(
    async (slot: TodaySlot) => {
      setBusyKey(slot.key);
      setOpenError("");
      try {
        const sessionId = await resolveSlotSessionId(token, slot);
        if (!sessionId) throw new Error("Sesi ini tidak bisa dibuka.");
        router.push(sessionFormHref(sessionId));
      } catch (caught) {
        setOpenError(caught instanceof Error ? caught.message : "Gagal membuka sesi.");
        setBusyKey(null);
      }
    },
    [router, token],
  );

  return { busyKey, openError, openSlot };
}
